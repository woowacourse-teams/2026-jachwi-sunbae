# 배포

- 상태: 동작 중
- 현재 배포 환경: prod `https://api.jachwi-sunbae.kr`, dev `https://dev-api.jachwi-sunbae.kr`

이 문서는 백엔드 배포 구성, 실제 배포 절차와 그 절차가 의존하는 서버 상태를 적는다.

## 배포 경로

브랜치 병합이 트리거다. `main`과 `develop`은 필수 상태 검사를 통과한 PR만 병합할 수 있다. 액세스 키를 만들 수 없으므로 GitHub Actions가 AWS에 직접 배포하지 않고, 제공된 service role로 동작하는 AWS 네이티브 파이프라인을 쓴다.

```text
develop 병합                       main 병합
  → jachwi-sunbae-dev-line           → jachwi-sunbae-line
    → Commands ─ jar 빌드              → Commands ─ jar 빌드
    → CodeDeploy                       → CodeDeploy
        jachwi-sunbae-dev-group            jachwi-sunbae-codeDeploy-group
        DeployTarget=jachwi-sunbae-dev     DeployTarget=jachwi-sunbae-prod
      → dev EC2                          → prod EC2
```

두 파이프라인은 **같은 빌드 명령과 같은 배포 훅**을 쓴다. 다른 것은 소스 브랜치와 배포 그룹뿐이다.

아티팩트 저장소는 두 파이프라인 모두 `techcourse-project-2026-artifacts`다.

### 배포 대상을 가르는 것

CodeDeploy 배포 그룹이 **EC2 태그**로 대상을 고른다.

| 환경 | 태그 | EC2 |
| --- | --- | --- |
| prod | `DeployTarget=jachwi-sunbae-prod` | `i-0ee91aab315b53005`. Vault 인증은 이 인스턴스 ID에 제한한다 |
| dev | `DeployTarget=jachwi-sunbae-dev` | ASG `jachwi-sunbae-dev-asg`, `t4g.micro`. 인스턴스 ID는 교체 시 바뀐다 |

**인스턴스를 새로 만들 때 이 태그를 틀리면 배포가 두 환경으로 나간다.** 태그 값이 배포 격리의 유일한 기준이다.

### 요청을 가르는 것

**ALB는 하나다.** 443 리스너의 호스트 기반 규칙이 요청을 나눈다.

| 우선순위 | 조건 | 대상 그룹 |
| --- | --- | --- |
| 1 | `Host = dev-api.jachwi-sunbae.kr` | `jachwi-sunbae-dev-tg` |
| 기본 | 그 외 전부 | `jachwi-sunbe-tg` (prod) |

**기본 작업을 바꾸지 않는다.** 조건에 걸리지 않는 요청은 prod로 간다. 기본 작업을 dev로 바꾸면 prod가 끊긴다.

인증서는 SNI로 두 장을 함께 붙인다.

## 저장소에 있는 것

| 파일 | 역할 |
| --- | --- |
| `backend/deploy/appspec.yml` | CodeDeploy 훅 순서를 정의한다 |
| `backend/deploy/jachwi-sunbae.service` | systemd 유닛 |
| `backend/deploy/scripts/` | 배포 훅 스크립트 |
| `backend/deploy/scripts/prepare_vault.sh` | dev·prod 배포 전에 Vault 클라이언트 도구와 공개 인증서를 준비한다 |
| `backend/deploy/scripts/certs/vault-ca.crt` | 배포 산출물에 포함하는 Vault 공개 인증서. TLS 개인키는 포함하지 않는다 |
| `backend/deploy/scripts/fetch_env.sh` | `dev` 또는 `prod` 인자로 해당 환경의 Vault 역할에 인증하고 환경변수 파일을 갱신한다 |

## 빌드 검증

배포 빌드는 `clean bootJar -x test`로 실행 가능한 JAR를 만든다. GitHub Actions는 PR과 `main`·`develop` push에서 `clean build`를 실행한다. 두 브랜치는 보호 규칙에 따라 필수 검사를 통과하지 않으면 병합할 수 없으므로 CodePipeline이 받는 커밋은 이미 전체 단위·통합 테스트를 통과한 상태다.

## 배포 훅

| 훅 | 하는 일 |
| --- | --- |
| `ApplicationStop` | 서비스 중지를 요청한다. **직전 리비전의 스크립트가 실행되므로 첫 배포에는 실행되지 않는다.** 교체를 이 훅에 의존하지 않는다 |
| `BeforeInstall` | `/opt/jachwi-sunbae`를 비운다. 이 배포가 만들지 않은 파일이 남아 있으면 CodeDeploy가 실패한다 |
| `AfterInstall` | 배포 그룹으로 dev·prod를 선택하고 Vault 도구·인증서를 준비한 뒤 해당 환경변수를 가져온다. 파일과 실행 사용자를 확인하고 권한을 맞추며 systemd 유닛을 설치한다 |
| `ApplicationStart` | 서비스를 **재시작**한다. 실제 프로세스 교체를 보장하는 단계다 |
| `ValidateService` | `/actuator/health`가 `UP`이고 `/actuator/info`의 `build.commit`이 이번 배포 SHA와 같은지 확인한다. 실패하면 배포를 중단하고 최근 로그를 남긴다 |

`AfterInstall`은 `/var/log/jachwi-sunbae`와 archive 디렉터리를 만들고 `jachwi` 사용자에게만 쓰기 권한을 준다.

## 프로세스 자동 재시작

systemd는 Java 프로세스가 비정상 종료되면 5초 뒤 재시작한다. 5분 동안 5번 연속 기동에 실패하면 무한 재시작으로 장애 원인을 덮지 않도록 멈춘다. `ExecStopPost`는 종료 결과와 exit status를 `/var/log/jachwi-sunbae/service-events.log`에 JSON으로 기록한다.

정상 배포의 SIGTERM은 실패가 아니므로 자동 재시작하지 않는다. 배포의 `ApplicationStart`가 새 리비전을 명시적으로 시작한다. EC2 자체의 중지나 AWS 호스트 장애는 systemd가 복구할 수 없다.

지속 장애의 원인을 해결한 뒤 재시작 제한 상태를 해제한다.

```bash
sudo systemctl reset-failed jachwi-sunbae.service
sudo systemctl start jachwi-sunbae.service
```

## 왜 `start`가 아니라 `restart`인가

`ApplicationStart`는 `systemctl start`가 아니라 `systemctl restart`를 쓴다.

`start`는 서비스가 이미 `active`이면 아무 일도 하지 않는다. `ApplicationStop`이 어떤 이유로든 중지에 실패하면 옛 프로세스가 그대로 남고 새 jar는 실행되지 않는다. 그 상태에서 `ValidateService`가 health를 확인하면 **옛 프로세스가 응답해 배포가 성공으로 기록된다.** 실제로는 아무것도 바뀌지 않았는데 초록불이 뜬다.

실제로 이 일이 있었다. `stop.sh`가 `systemctl list-unit-files` 출력을 grep해 서비스 존재를 검사했는데 그 검사가 어긋나 중지를 건너뛰었고, 이어진 배포가 1초 만에 health를 통과했다.

`ApplicationStop`에 기대는 설계 자체가 옳지 않다. 이 훅은 **직전 리비전의 스크립트**로 실행되므로 첫 배포에서는 아예 실행되지 않고, 직전 리비전의 스크립트가 잘못돼 있으면 동작하지도 않는다. 프로세스 교체는 `restart`가 보장한다.

## 이번 리비전이 실행됐는지 확인하는 방법

`restart`는 알려진 프로세스 교체 실패를 막지만 실행 중인 프로세스의 정체를 증명하지는 않는다. 빌드와 검증은 같은 소스 SHA를 다음 두 곳에 넣는다.

- Gradle `buildInfo`의 `build.commit`: 실행 중인 애플리케이션이 `/actuator/info`로 응답한다.
- `deployment-revision.txt`: CodeDeploy가 이번 산출물과 함께 `/opt/jachwi-sunbae`에 배치한다.

`ValidateService`는 health가 `UP`이어도 두 SHA가 다르면 즉시 실패한다. 옛 프로세스가 응답하거나 다른 산출물이 배포된 경우를 성공으로 기록하지 않는다. `deployment-revision.txt`가 없거나 SHA 형식이 아니어도 실패한다.

## 애플리케이션 포트

**운영에서 애플리케이션은 80을 듣는다.** 로컬 기본값 8080과 다르다.

`project-app` 보안 그룹은 `project-lb`에서 오는 80과 443만 허용한다. 8080은 열려 있지 않고, 공용 보안 그룹이라 규칙을 추가하면 다른 팀 인스턴스에도 열린다. 그래서 규칙을 바꾸지 않고 애플리케이션을 80으로 옮겼다.

비루트 계정은 1024 미만 포트에 바인딩할 수 없으므로 systemd 유닛에서 `AmbientCapabilities=CAP_NET_BIND_SERVICE`를 준다. EC2 안에서 iptables로 80을 8080으로 넘기는 방법도 있지만, 그 규칙은 저장소에 남지 않고 재부팅 시 사라져 따로 영속화해야 한다.

포트를 바꾸면 세 곳을 함께 고친다. `application-prod.yml`의 `server.port`, `scripts/validate.sh`의 `HEALTH_URL`, ALB 대상 그룹의 포트다. **대상 그룹은 만든 뒤 포트를 바꿀 수 없다.**

## 서버에 있어야 하는 것

배포 전에 다음을 준비한다. 이 리비전의 배포 훅은 dev·prod 모두 환경변수 파일을 `AfterInstall`에서 생성한다.

| 대상 | 내용 |
| --- | --- |
| `/etc/jachwi-sunbae/app.env` | 환경별 Vault 설정으로 생성·갱신한다. `0600`, 소유자 `root:root` |
| 사용자 `jachwi` | 애플리케이션 실행 계정. 로그인 셸이 없다 |
| 디렉터리 `/opt/jachwi-sunbae` | 배포 대상 |
| CodeDeploy 에이전트 | `systemctl status codedeploy-agent`가 `active` |

**환경변수 파일은 배포 산출물에 넣지 않는다.** CodeDeploy가 덮어쓰는 경로 밖에 두어 배포마다 값이 사라지지 않게 한다. systemd가 `EnvironmentFile`로 root 권한에서 읽은 뒤 `jachwi`로 내려가므로 애플리케이션 계정에 읽기 권한을 주지 않는다.

애플리케이션은 CORS 허용 Origin과 인증·저장소 설정을 환경변수로 사용한다. dev·prod 각각의 Vault 경로에서 설정을 관리한다. 새 환경변수를 도입할 때 코드와 환경별 설정을 함께 준비한다.

`SPRING_PROFILES_ACTIVE`는 dev와 prod 모두 `prod`로 둔다. 이 프로필은 애플리케이션이 80 포트를 사용하게 한다.

## dev·prod 환경변수를 Vault에서 가져오기

### 적용 상태와 배포 순서

2026-10-07 dev 배포에 Vault 연결을 적용했다. 기존 AMI로 생성한 인스턴스의 자동 배포 `d-T38S07W7L` 성공에 이어, `app.env`와 인증 nonce를 제외한 AMI로 새 인스턴스를 생성했다. **새 인스턴스의 Vault 허용 목록 반영, 환경변수 다운로드, CodeDeploy 자동 배포, 서비스 기동과 ALB 헬스 체크를 확인했다.** prod는 아직 기존 파일을 사용한다.

이 리비전은 prod 배포 훅도 Vault에 연결한다. 위 내용은 실제 배포 검증 상태이며, prod의 이 리비전 CodeDeploy 검증은 병합·배포 후에 진행한다.

두 환경의 배포 훅은 공유하며, `DEPLOYMENT_GROUP_NAME`으로 환경을 선택하고 `fetch_env.sh`에 전달한다. 스크립트는 `dev` 또는 `prod` 인자 하나만 허용하며, 잘못된 인자는 인증이나 파일 작업 전에 오류로 종료한다.

| CodeDeploy 배포 그룹 | 환경변수 준비 방법 |
| --- | --- |
| `jachwi-sunbae-dev-group` | `fetch_env.sh dev`: `jachwi-dev` 역할, `secret/jachwi-sunbae/dev` |
| `jachwi-sunbae-codeDeploy-group` | `fetch_env.sh prod`: `jachwi-prod` 역할, `secret/jachwi-sunbae/prod` |
| 그 외 또는 배포 그룹 미설정 | 오류로 종료한다 |

```text
AfterInstall (제한 시간 420초)
  → prepare_vault.sh (전체 실행 제한 180초, 종료 유예 5초)
    → 필요한 클라이언트 도구와 Vault CLI 2.1.1 설치
    → 공개 인증서 검증 및 서버에 배치
  → fetch_env.sh dev 또는 prod (전체 실행 제한 180초, 종료 유예 5초)
    → IMDSv2로 EC2 신원 정보 조회
    → Vault 인증: 최대 6회, 실패 사이에 10초 대기
    → 임시 파일에 app.env 다운로드
    → 파일과 필수 항목 확인
    → root:root, 0600으로 설정하고 기존 파일 교체
  → 실행 사용자·권한 확인 및 systemd 유닛 설치
ApplicationStart
  → 애플리케이션 재시작
ValidateService
  → health=UP 및 배포 SHA 일치 확인
```

### 앱 EC2 준비 사항

| 준비 항목 | 용도 |
| --- | --- |
| Vault CLI `2.1.1`, `jq`, `openssl`, `curl`, `timeout` | 인증, 응답 처리, nonce 생성, 신원 조회, 실행 시간 제한 |
| `/etc/jachwi-sunbae/vault-ca.crt` | Vault HTTPS 인증서 검증용 공개 인증서 |
| Vault `https://10.0.100.209:8200`으로의 접속 | dev·prod EC2에서 Vault API 사용 |
| IMDSv2 접근 | AWS가 서명한 EC2 신원 정보 조회 |
| `/etc/jachwi-sunbae/vault-ec2-nonce` | 같은 인스턴스의 재인증에 사용. 최초 실행 시 생성하며 이후 유지한다 |

dev·prod `AfterInstall`은 `prepare_vault.sh`를 먼저 실행한다. 필요한 도구가 없으면 `dnf`로 설치하고, Vault 패키지가 `2.1.1`이 아니면 공식 Amazon Linux 저장소에서 해당 버전 설치를 시도한다. 이미 같은 버전이 있으면 Vault 패키지 설치를 생략한다. 더 높은 버전이 설치된 경우 자동 다운그레이드를 보장하지 않으며, 최종 버전 검사가 실패하면 배포를 중단한다.

이 준비 과정은 Amazon Linux 2023과 공식 패키지 저장소로의 HTTPS 접속을 전제로 한다. 새 인스턴스에는 기존 Java 런타임, `jachwi` 사용자, CodeDeploy 에이전트도 필요하다. 이 항목은 `prepare_vault.sh`에서 설치하지 않는다.

공개 인증서는 `scripts/certs/vault-ca.crt`로 배포 산출물에 포함한다. 준비 스크립트는 인증서의 유효성과 Vault IP `10.0.100.209` 일치를 검사하고, 성공했을 때 `/etc/jachwi-sunbae/vault-ca.crt`를 `root:root`, `0644`로 교체한다. `app.env`와 기존 nonce는 변경하지 않으며 앱 EC2의 Vault 서버 서비스는 시작하지 않는다.

설치와 다운로드에 각각 최대 180초 및 종료 유예 5초를 배정하고, 나머지 설치 작업 시간을 고려해 `AfterInstall` 제한을 420초로 둔다. 이번 ASG 검증에는 Vault CLI가 이미 설치된 AMI를 사용했다. CLI가 없는 새 OS에서 패키지를 설치하는 경로까지 실제 EC2에서 검증한 것은 아니다.

환경변수 값과 Vault 토큰은 AMI·저장소·배포 산출물에 넣지 않는다. 인증서의 공개 부분은 배포할 수 있지만 Vault TLS 개인키는 앱 서버로 전달하지 않는다. nonce는 인스턴스별로 생성하므로 AMI에서 제외한다.

### prod Vault 등록과 인증 검증

2026-10-07에 현재 prod EC2의 `/etc/jachwi-sunbae/app.env` 전체 내용을 KV v2의 `secret/jachwi-sunbae/prod`에 `app_env` 필드로 등록했다. 최초 등록 버전은 `1`이다. 등록과 검증은 prod EC2에서 인증서를 검증한 HTTPS 요청으로 수행했으며, 비밀값을 콘솔 출력이나 배포 산출물에 넣지 않았다.

| 항목 | 설정 |
| --- | --- |
| AWS EC2 인증 역할 | `jachwi-prod` |
| 허용 인스턴스 | `i-0ee91aab315b53005` |
| 추가 인증 조건 | 계정 `843255971531`, 리전 `ap-northeast-2`, VPC `vpc-004e154d9f1f3f5cd`, 서브넷 `subnet-0e693cde6a836c0b8` |
| 읽기 정책 | `jachwi-prod-read`: `secret/data/jachwi-sunbae/prod`의 `read`만 허용 |
| 토큰 수명 | TTL·최대 TTL 모두 `300`초, 기본 정책 미부여 |
| 클라이언트 파일 | 공개 인증서 `vault-ca.crt`는 `0644`, 인스턴스별 `vault-ec2-nonce`는 `0600`, 소유자는 `root:root` |

초기 등록 동안만 `jachwi-prod-import` 정책으로 prod 경로에 쓰기를 허용했다. 등록 후 역할을 `jachwi-prod-read`로 전환하고 임시 등록 토큰을 폐기했으며, import 정책도 `deny`로 변경했다. 검증에 사용한 임시 환경변수 파일과 로그인 응답 파일은 정리했다.

검증 결과는 다음과 같다.

- 읽기 전용 토큰으로 가져온 `app_env`와 기존 prod 파일이 `cmp` 비교에서 일치했다.
- 폐기한 임시 토큰으로 prod 비밀값을 조회하면 HTTP `403`이 반환됐다.
- prod 읽기 토큰으로 dev 비밀값을 조회하거나 prod 비밀값에 쓰기를 요청하면 HTTP `403`이 반환됐다.
- prod 애플리케이션은 `active`, `/actuator/health`는 `UP`이었다.

현재 운영 중인 prod 리비전은 기존 `app.env`를 사용한다. 이 리비전의 `AfterInstall`은 prod Vault 연결을 포함하지만 실제 prod CodeDeploy 배포 검증은 아직 수행하지 않았다. 인증 역할은 현재 인스턴스 ID에 제한되어 있으므로 prod EC2를 교체하면 허용 ID도 갱신해야 한다.

### dev ASG의 AMI와 시작 템플릿

AMI 생성 작업은 서비스 중인 EC2에서 진행하지 않는다. 기존 dev가 ALB에서 `healthy`인지 확인한 뒤 테스트 인스턴스를 ASG에서 분리하고, 연결 종료 대기가 끝나 ALB에서도 제외된 후 작업했다. 분리할 때 원하는 용량을 함께 줄여 불필요한 대체 인스턴스 생성을 막았다.

작업용 인스턴스에서는 앱 서비스를 중지하고 자동 시작을 해제했다. `app.env`, 과거 `app.env` 백업, 인스턴스별 nonce와 발견된 셸 이력을 EBS에 저장되지 않는 `/run`의 `tmpfs`로 옮겼다. Java, 실행 사용자, 공개 인증서, CodeDeploy·SSM·CloudWatch 에이전트는 유지했다. 이후 해당 인스턴스를 재부팅하는 방식으로 AMI를 생성했다. 이는 파일 경로에서의 제외이며, 과거 비밀값의 디스크 완전 소거를 검증한 것은 아니다.

| 항목 | 2026-10-07 검증 구성 |
| --- | --- |
| AMI | `ami-010ffe62c648da620` (`jachwi-sunbae-dev-vault-base-20261007`) |
| AMI 스냅샷 | `snap-048fcbe9701fad2f8` |
| 시작 템플릿 | `lt-001ccfbad12f1545b` / `jachwi-sunbae-dev-lt`, 버전 `10` |
| ASG | `jachwi-sunbae-dev-asg`. 검증 후 최소·원하는·최대 용량을 각각 `1`로 복원했다 |
| 검증 인스턴스 | `i-082f3f62bf20385e0`, `10.0.20.110` |
| 자동 배포 | [CodeDeploy `d-NAY58TW7L`](https://ap-northeast-2.console.aws.amazon.com/codesuite/codedeploy/deployments/d-NAY58TW7L?region=ap-northeast-2) |

AMI와 스냅샷에는 `Service=techcourse`, `Role=techcourse-etc`, `ProjectTeam=jachwi-sunbae`를 지정했다. 시작 템플릿은 EC2와 EBS에도 같은 필수 태그를 부여한다. ASG는 `$Latest` 대신 검증한 버전 `10`을 명시해, 새 버전 생성만으로 복구 구성이 바뀌지 않게 했다.

새 EC2의 앱은 부팅만으로 시작하지 않는다. CodeDeploy `AfterInstall`이 Vault에서 `app.env`를 생성하고 systemd 유닛의 자동 시작을 활성화한 뒤, `ApplicationStart`에서 서비스를 시작한다. 따라서 코드 배포 성공과 Vault 설정 다운로드 성공이 모두 필요하다. 환경변수 변경만으로 AMI를 다시 만들 필요는 없다. Java·에이전트 등 기반 구성을 변경할 때는 새 AMI 검증이 필요하다.

### 저장 경로와 인증 권한

환경별 설정은 KV v2의 `secret/jachwi-sunbae/dev`와 `secret/jachwi-sunbae/prod` 경로에서 `app_env` 항목에 파일 내용 그대로 저장한다. 인증 역할 `jachwi-dev`와 `jachwi-prod`는 각각 같은 환경의 읽기 정책만 부여한다. 정책 경로는 `secret/data/jachwi-sunbae/dev`와 `secret/data/jachwi-sunbae/prod`이고 발급 토큰의 기본·최대 유효기간은 5분이다.

공용 `ec2-project` IAM 역할만으로 팀을 구분하지 않는다. Vault는 계정·리전·VPC·서브넷과 허용된 EC2 인스턴스 ID를 함께 검사한다. 이 구성은 공용 AWS 계정의 관리 권한까지 팀별로 격리하는 것은 아니다.

Vault 서버의 `jachwi-sync-dev-asg.timer`는 이전 실행 종료 약 30초 후 `jachwi-sync-dev-asg.service`를 실행한다. 서비스는 `jachwi-sunbae-dev-asg`의 `InService` 및 `Pending`으로 시작하는 상태의 인스턴스 ID를 반영한다. 시작 중인 인스턴스도 포함해야 CodeDeploy 배포 검증 전에 인증할 수 있다.

- 갱신 작업은 Vault 서버 자신의 EC2 신원으로 `jachwi-vault-asg-sync` 역할에 인증한다.
- `jachwi-dev-asg-sync` 정책은 dev 역할의 `bound_ec2_instance_id` 항목만 갱신하도록 제한한다.
- ASG 조회 실패나 빈 목록이면 오류로 종료하고 기존 목록을 유지한다. 중복 실행은 파일 잠금으로 막는다.
- Vault 재시작 후에는 수동 unseal이 필요하다. 봉인 중에는 인증과 갱신이 실패하고, unseal 후 다음 타이머 실행에서 갱신을 재시도한다.

### 실패 처리와 수동 갱신

다운로드는 같은 디렉터리의 임시 파일에 저장한다. 파일이 비어 있지 않고 `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USERNAME`, `DB_PASSWORD`, `JWT_SECRET` 항목이 있는지 검사한 뒤 기존 파일을 교체한다. 항목 존재 검사는 값의 유효성이나 앱 기동 성공까지 보장하지 않으므로 `ValidateService`에서 추가 확인한다.

인증·다운로드·검사 실패 시 임시 파일을 제거하고 기존 `app.env`를 보존한다. dev·prod `AfterInstall`도 실패하므로 `ApplicationStart`로 넘어가지 않는다. **앞선 `ApplicationStop`에서 앱이 이미 중지됐을 수 있으므로 파일 보존이 서비스 무중단을 의미하지는 않는다.**

Vault 설정을 바꿔도 실행 중인 앱에 바로 반영되지는 않는다. 이 리비전 배포 후에는 앱 EC2에서 환경을 명시해 다음 순서로 수동 반영할 수 있다. 아래 예시는 dev이며 prod는 인자를 `prod`로 바꾼다.

```bash
sudo timeout --kill-after=5s 180s bash /opt/jachwi-sunbae/scripts/fetch_env.sh dev \
  && sudo systemctl restart jachwi-sunbae.service
```

다운로드가 성공했을 때만 재시작한다. `app.env` 삭제나 `systemctl restart`만으로 Vault 다운로드가 실행되는 구성은 아니다.

### 변경 검증

환경 분기 변경은 격리된 임시 디렉터리에서 IMDS·Vault·systemd 명령을 대체하여 12개 시나리오를 검증했다. dev·prod 역할과 비밀값 경로 선택, 인자 누락·미지원 환경·초과 인자 거부, 다운로드 실패·필수 키 누락 시 기존 파일 보존과 임시 파일 정리, 두 배포 그룹의 훅 실행 순서, 미지원 배포 그룹 거부, 준비·다운로드 실패 시 훅 중단을 확인했다. 이 검증은 실제 AWS·Vault 통합 배포를 대신하지 않는다.

저장소 루트에서 다음 검사를 실행한다.

```bash
bash -n backend/deploy/scripts/prepare_vault.sh
bash -n backend/deploy/scripts/fetch_env.sh
bash -n backend/deploy/scripts/after_install.sh
git diff --check
```

환경변수 파일을 제외한 AMI에서 생성한 `i-082f3f62bf20385e0`에 대해 다음 결과를 확인했다. 비밀값이나 Vault 토큰의 내용은 출력하지 않았다.

| 검증 항목 | 확인 결과 |
| --- | --- |
| Vault 인증 허용 목록 | ASG 생성 후 새 인스턴스 ID가 자동 반영됐다 |
| CodeDeploy | ASG가 실행한 `d-NAY58TW7L`이 `Succeeded`. `AfterInstall`, `ApplicationStart`, `ValidateService`도 모두 `Succeeded`. 2026-10-07 13:07:27~13:08:41 KST, 약 74초 |
| 환경변수 다운로드 | 해당 배포의 `scripts.log`에 `Vault에서 dev app.env를 갱신했습니다.` 기록 |
| 파일 권한 | `app.env`와 nonce는 `600 root:root`, 공개 인증서는 `644 root:root` |
| 서비스 / 헬스 | `jachwi-sunbae.service=active`, `/actuator/health`의 `status=UP` |
| 실행 버전 | `/actuator/info`의 `build.commit`과 `deployment-revision.txt`가 `b439a1494b57a83591d6f6f07f22b6f890036c46`으로 일치 |
| ALB | 새 인스턴스가 `healthy` |

SSM 검증 명령 `5808ed3d-5338-431f-9c1e-38f366f66158`도 `Success`, 종료 코드 `0`을 반환했다. 이 검증은 기존 dev를 유지한 채 두 번째 인스턴스를 추가해서 진행했다. prod 적용과 Vault 서버 장애 시 복구는 이 검증 범위에 포함하지 않는다.

검증 후 기존 dev를 ASG에서 분리해 원하는 용량을 줄였고, ALB의 연결 종료 대기가 끝난 뒤 중지했다. 최종 ASG는 새 인스턴스 한 대만 `InService`, `Healthy`이며 Vault 허용 목록에도 이 ID만 남아 있다. 공개 dev 주소의 `/actuator/health`도 `UP`을 확인했다.

| 보관 인스턴스 | 최종 상태와 용도 |
| --- | --- |
| `i-03524d449110c0d08` (`jachwi-sunbae-dev-rollback`) | `stopped`. 기존 dev 복구용. ASG와 일반 CodeDeploy 배포 대상에서 제외 |
| `i-08b93ed167aeb8b26` (`jachwi-sunbae-dev-ami-builder`) | `stopped`. AMI 생성 작업용. ASG와 일반 CodeDeploy 배포 대상에서 제외 |

두 인스턴스의 EBS는 보관 중이므로 스토리지 비용이 계속 발생한다. 인스턴스를 다시 켜는 것만으로 ASG나 Vault 허용 목록에 복귀하지는 않는다. 롤백 시에는 시작 템플릿 버전, ASG 용량·연결, 배포 대상 태그를 함께 확인한다.

### MVP1 첫 dev 배포 전 확인

1. RDS 자동 백업의 최신 복구 지점을 확인한다. 사용자 데이터를 삭제하지 않는다.
2. 아래 사전 점검 쿼리를 dev DB에서 실행한다. 두 쿼리 모두 결과가 없어야 한다. 결과가 있으면 행을 임의로 지우지 말고 사진 관계를 먼저 확인한다.

   ```sql
   SELECT property_id, COUNT(*) AS representative_count
   FROM main_property_photos
   GROUP BY property_id
   HAVING COUNT(*) > 1;

   SELECT main_photo.id, main_photo.property_id, main_photo.property_photos_id,
          photo.property_id AS actual_photo_property_id
   FROM main_property_photos AS main_photo
   JOIN property_photos AS photo ON photo.id = main_photo.property_photos_id
   WHERE main_photo.property_id <> photo.property_id;
   ```

3. dev 애플리케이션 DB 계정에 서비스 실행에 필요한 `SELECT`, `INSERT`, `UPDATE`, `DELETE` 권한이 있는지 확인한다.
4. dev DB·JWT·CORS·선택한 지도 공급자 인증 정보·S3 접두사를 dev 환경에 맞게 설정한다. Vault 배포 연결 후에는 `secret/jachwi-sunbae/dev`의 `app_env`를 갱신한다. 정적 AWS 키는 두지 않는다.
5. 버스정류소 API 승인이 끝나지 않았다면 `BUS_STOP_PROVIDER=none`으로 둔다.
6. 프론트 dev `Commands` 액션에 `API_BASE_URL=https://dev-api.jachwi-sunbae.kr`, `MAP_PROVIDER_MODE`, 선택한 지도 공급자의 공개 키, 운영과 같은 `POSTHOG_PROJECT_TOKEN`, `POSTHOG_HOST=https://us.i.posthog.com`을 주입한다. PostHog 데이터는 `environment=development` 속성으로 운영 데이터와 구분한다.

애플리케이션은 배포 중 RDS 스키마를 자동 변경하지 않는다. `db/init`은 빈 로컬 MySQL을 만들기 위한 기준선이므로 기존 RDS에 직접 실행하지 않는다. 스키마 전환이 필요한 배포는 백업, 데이터 덤프, 새 스키마 생성, 데이터 적재, 무결성 검증을 별도 작업으로 수행하고 결과를 배포 이슈에 기록한다.

prod 전환은 dev 전환과 보관 데이터 확인이 끝난 뒤에만 진행한다. prod DB에서도 배포 직전에 최신 자동 백업 복구 지점을 확인하고, 복구 지점 식별자와 확인 시각을 배포 이슈에 남긴다.

## 빌드를 CodeBuild가 아니라 Commands로 하는 이유

별도 CodeBuild 프로젝트를 두지 않고 CodePipeline의 `Commands` 액션을 쓴다. 같은 계정의 다른 팀이 CodeBuild 경로에서 막혔기 때문이다. `codebuild-project` 서비스 role에 파이프라인 `SourceArtifact`를 읽을 `s3:GetObject` 권한이 없어 빌드 입력을 내려받지 못했고, 팀은 role 정책을 바꿀 수 없다.

`Commands`는 파이프라인 서비스 role을 그대로 쓰므로 이 문제를 겪지 않는다. 대신 빌드 정의가 저장소가 아니라 콘솔에 있다. 파이프라인 설정을 바꾸면 이 문서를 함께 고친다.

빌드 명령은 다음을 한다.

1. Corretto 21을 설치하고 `JAVA_HOME`을 잡는다. **관리형 환경의 기본 Java가 17일 수 있어 버전을 명시한다.**
2. Source 작업이 출력한 `CommitId`를 `SOURCE_COMMIT_ID`로 전달받아 40자리 Git SHA인지 확인한다.
3. 그 SHA를 `build.commit`으로 넣고 `clean bootJar -x test`로 실행 가능한 jar를 만든다.
4. 같은 SHA를 `deployment-revision.txt`에 기록한다.
5. `-plain.jar`가 아닌 jar를 `app.jar`로 복사한다.
6. `backend/deploy/`의 내용을 작업 디렉터리 루트로 옮긴다. **`appspec.yml`이 아티팩트 최상단에 없으면 CodeDeploy가 배포를 시작하지 못한다.**

Commands 액션은 GitHub 소스를 직접 받는 CodeBuild 프로젝트가 아니라 `SourceArtifact`를 입력으로 받는다. 이 구성에서는 `CODEBUILD_RESOLVED_SOURCE_VERSION`이 자동으로 제공되지 않으므로 Source 작업의 출력 변수를 Build 작업에 명시적으로 연결한다.

| 설정 위치 | 값 |
| --- | --- |
| Source 작업 변수 네임스페이스 | `SourceVariables` |
| Build 작업 환경 변수 이름 | `SOURCE_COMMIT_ID` |
| Build 작업 환경 변수 값 | `#{SourceVariables.CommitId}` |

빌드 명령에는 다음 검증과 파일 생성을 포함한다.

```bash
REVISION="${SOURCE_COMMIT_ID:?source revision is missing}"
printf '%s' "${REVISION}" | grep -Eq '^[0-9a-f]{40}$'
SOURCE_COMMIT_ID="${REVISION}" ./backend/gradlew -p backend --no-daemon --max-workers=1 clean bootJar -x test
printf '%s\n' "${REVISION}" > deployment-revision.txt
```

출력 아티팩트 `BuildArtifact`에는 `app.jar`, `deployment-revision.txt`, `appspec.yml`, `jachwi-sunbae.service`, `scripts/**/*`가 들어간다. 이 목록을 비워두면 Deploy 단계의 입력이 저장소 원본으로 잡혀 배포가 실패한다.

## 로그 확인

```bash
sudo journalctl -u jachwi-sunbae.service -f
sudo systemctl status jachwi-sunbae.service
sudo tail -f /var/log/jachwi-sunbae/application.log
sudo tail -f /var/log/jachwi-sunbae/service-events.log
```

배포 자체가 실패했다면 EC2의 `/opt/codedeploy-agent/deployment-root/deployment-logs/`를 함께 본다.

배포 결과는 관련 GitHub 이슈 또는 PR에 기록한다.
