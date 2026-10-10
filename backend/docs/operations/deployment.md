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
| prod | `DeployTarget=jachwi-sunbae-prod` | `i-0f602d10ed2ace6c7` `t4g.small` |
| dev | `DeployTarget=jachwi-sunbae-dev` | `i-068617b197557da19` `t4g.micro` |

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
| `backend/deploy/scripts/prepare_vault.sh` | dev 배포 전에 Vault 클라이언트 도구와 공개 인증서를 준비한다 |
| `backend/deploy/scripts/certs/vault-ca.crt` | 배포 산출물에 포함하는 Vault 공개 인증서. TLS 개인키는 포함하지 않는다 |
| `backend/deploy/scripts/fetch_env.sh` | dev EC2 신원으로 Vault에 인증하고 환경변수 파일을 갱신한다 |

## 빌드 검증

배포 빌드는 `clean bootJar -x test`로 실행 가능한 JAR를 만든다. GitHub Actions는 PR과 `main`·`develop` push에서 `clean build`를 실행한다. 두 브랜치는 보호 규칙에 따라 필수 검사를 통과하지 않으면 병합할 수 없으므로 CodePipeline이 받는 커밋은 이미 전체 단위·통합 테스트를 통과한 상태다.

## 배포 훅

| 훅 | 하는 일 |
| --- | --- |
| `ApplicationStop` | 서비스 중지를 요청한다. **직전 리비전의 스크립트가 실행되므로 첫 배포에는 실행되지 않는다.** 교체를 이 훅에 의존하지 않는다 |
| `BeforeInstall` | `/opt/jachwi-sunbae`를 비운다. 이 배포가 만들지 않은 파일이 남아 있으면 CodeDeploy가 실패한다 |
| `AfterInstall` | dev는 Vault 도구·인증서를 준비하고 환경변수를 가져온 뒤 파일과 실행 사용자를 확인한다. prod는 기존 환경변수 파일을 확인한다. 이후 권한을 맞추고 systemd 유닛을 설치한다 |
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

배포 전에 다음을 준비한다. dev의 환경변수 파일은 `AfterInstall`에서 생성하고, prod는 기존 파일을 사용한다.

| 대상 | 내용 |
| --- | --- |
| `/etc/jachwi-sunbae/app.env` | 환경별 설정. dev는 Vault에서 생성·갱신하고, prod는 미리 준비한다. `0600`, 소유자 `root:root` |
| 사용자 `jachwi` | 애플리케이션 실행 계정. 로그인 셸이 없다 |
| 디렉터리 `/opt/jachwi-sunbae` | 배포 대상 |
| CodeDeploy 에이전트 | `systemctl status codedeploy-agent`가 `active` |

**환경변수 파일은 배포 산출물에 넣지 않는다.** CodeDeploy가 덮어쓰는 경로 밖에 두어 배포마다 값이 사라지지 않게 한다. systemd가 `EnvironmentFile`로 root 권한에서 읽은 뒤 `jachwi`로 내려가므로 애플리케이션 계정에 읽기 권한을 주지 않는다.

애플리케이션은 CORS 허용 Origin과 인증·저장소 설정을 환경변수로 사용한다. dev는 Vault에 저장한 설정을 갱신하고, prod는 서버의 환경변수 파일을 갱신한다. 새 환경변수를 도입할 때 코드와 환경별 설정을 함께 준비한다.

`SPRING_PROFILES_ACTIVE`는 dev와 prod 모두 `prod`로 둔다. 이 프로필은 애플리케이션이 80 포트를 사용하게 한다.

## dev 환경변수를 Vault에서 가져오기

### 적용 상태와 배포 순서

2026-10-07 기준 dev EC2에서 Vault 인증, 다운로드, 원본 파일과의 해시 일치, 인증 재시도 코드의 정상 실행을 확인했다. Vault 서버의 ASG 허용 목록 갱신 타이머도 수동 실행과 주기 실행을 확인했다. **저장소의 배포 훅 연결은 준비 단계이며, 실제 CodeDeploy 배포와 새 ASG 인스턴스의 복구는 아직 검증하지 않았다.**

두 환경의 배포 훅은 공유하지만, `DEPLOYMENT_GROUP_NAME`으로 Vault 적용 여부를 구분한다.

| CodeDeploy 배포 그룹 | 환경변수 준비 방법 |
| --- | --- |
| `jachwi-sunbae-dev-group` | `fetch_env.sh`로 Vault에서 가져온다 |
| `jachwi-sunbae-codeDeploy-group` | 서버의 기존 `app.env`를 사용한다. Vault 등록·인증 검증 후 연결 예정이다 |
| 그 외 또는 배포 그룹 미설정 | 오류로 종료한다 |

```text
AfterInstall (제한 시간 420초)
  → prepare_vault.sh (전체 실행 제한 180초, 종료 유예 5초)
    → 필요한 클라이언트 도구와 Vault CLI 2.1.1 설치
    → 공개 인증서 검증 및 서버에 배치
  → fetch_env.sh (전체 실행 제한 180초, 종료 유예 5초)
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

### dev EC2 준비 사항

| 준비 항목 | 용도 |
| --- | --- |
| Vault CLI `2.1.1`, `jq`, `openssl`, `curl`, `timeout` | 인증, 응답 처리, nonce 생성, 신원 조회, 실행 시간 제한 |
| `/etc/jachwi-sunbae/vault-ca.crt` | Vault HTTPS 인증서 검증용 공개 인증서 |
| Vault `https://10.0.100.209:8200`으로의 접속 | dev EC2에서 Vault API 사용 |
| IMDSv2 접근 | AWS가 서명한 EC2 신원 정보 조회 |
| `/etc/jachwi-sunbae/vault-ec2-nonce` | 같은 인스턴스의 재인증에 사용. 최초 실행 시 생성하며 이후 유지한다 |

새 ASG 인스턴스에서는 dev `AfterInstall`이 `prepare_vault.sh`를 먼저 실행한다. 필요한 도구가 없으면 `dnf`로 설치하고, Vault 패키지가 `2.1.1`이 아니면 공식 Amazon Linux 저장소에서 해당 버전 설치를 시도한다. 이미 같은 버전이 있으면 Vault 패키지 설치를 생략한다. 더 높은 버전이 설치된 경우 자동 다운그레이드를 보장하지 않으며, 최종 버전 검사가 실패하면 배포를 중단한다.

이 준비 과정은 Amazon Linux 2023과 공식 패키지 저장소로의 HTTPS 접속을 전제로 한다. 새 인스턴스에는 기존 Java 런타임, `jachwi` 사용자, CodeDeploy 에이전트도 필요하다. 이 항목은 `prepare_vault.sh`에서 설치하지 않는다.

공개 인증서는 `scripts/certs/vault-ca.crt`로 배포 산출물에 포함한다. 준비 스크립트는 인증서의 유효성과 Vault IP `10.0.100.209` 일치를 검사하고, 성공했을 때 `/etc/jachwi-sunbae/vault-ca.crt`를 `root:root`, `0644`로 교체한다. `app.env`와 기존 nonce는 변경하지 않으며 앱 EC2의 Vault 서버 서비스는 시작하지 않는다.

설치와 다운로드에 각각 최대 180초 및 종료 유예 5초를 배정하고, 나머지 설치 작업 시간을 고려해 `AfterInstall` 제한을 420초로 둔다. 새 인스턴스에서의 설치와 실제 복구는 별도 검증이 필요하다.

환경변수 값과 Vault 토큰은 AMI·저장소·배포 산출물에 넣지 않는다. 인증서의 공개 부분은 배포할 수 있지만 Vault TLS 개인키는 앱 서버로 전달하지 않는다. nonce는 인스턴스별로 생성하므로 AMI에서 제외한다.

### 저장 경로와 인증 권한

dev 설정은 KV v2의 `secret/jachwi-sunbae/dev` 경로에서 `app_env` 항목에 파일 내용 그대로 저장한다. dev 인증 역할 `jachwi-dev`는 `jachwi-dev-read` 정책을 부여하며, 이 정책은 `secret/data/jachwi-sunbae/dev`의 읽기만 허용한다. 발급 토큰의 기본·최대 유효기간은 5분이다.

공용 `ec2-project` IAM 역할만으로 팀을 구분하지 않는다. Vault는 계정·리전·VPC·서브넷과 허용된 EC2 인스턴스 ID를 함께 검사한다. 이 구성은 공용 AWS 계정의 관리 권한까지 팀별로 격리하는 것은 아니다.

Vault 서버의 `jachwi-sync-dev-asg.timer`는 이전 실행 종료 약 30초 후 `jachwi-sync-dev-asg.service`를 실행한다. 서비스는 `jachwi-sunbae-dev-asg`의 `InService` 및 `Pending`으로 시작하는 상태의 인스턴스 ID를 반영한다. 시작 중인 인스턴스도 포함해야 CodeDeploy 배포 검증 전에 인증할 수 있다.

- 갱신 작업은 Vault 서버 자신의 EC2 신원으로 `jachwi-vault-asg-sync` 역할에 인증한다.
- `jachwi-dev-asg-sync` 정책은 dev 역할의 `bound_ec2_instance_id` 항목만 갱신하도록 제한한다.
- ASG 조회 실패나 빈 목록이면 오류로 종료하고 기존 목록을 유지한다. 중복 실행은 파일 잠금으로 막는다.
- Vault 재시작 후에는 수동 unseal이 필요하다. 봉인 중에는 인증과 갱신이 실패하고, unseal 후 다음 타이머 실행에서 갱신을 재시도한다.

### 실패 처리와 수동 갱신

다운로드는 같은 디렉터리의 임시 파일에 저장한다. 파일이 비어 있지 않고 `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USERNAME`, `DB_PASSWORD`, `JWT_SECRET` 항목이 있는지 검사한 뒤 기존 파일을 교체한다. 항목 존재 검사는 값의 유효성이나 앱 기동 성공까지 보장하지 않으므로 `ValidateService`에서 추가 확인한다.

인증·다운로드·검사 실패 시 임시 파일을 제거하고 기존 `app.env`를 보존한다. dev `AfterInstall`도 실패하므로 `ApplicationStart`로 넘어가지 않는다. **앞선 `ApplicationStop`에서 앱이 이미 중지됐을 수 있으므로 파일 보존이 서비스 무중단을 의미하지는 않는다.**

Vault 설정을 바꿔도 실행 중인 앱에 바로 반영되지는 않는다. 배포 훅 연결 후에는 dev EC2에서 다음 순서로 수동 반영할 수 있다.

```bash
sudo timeout --kill-after=5s 180s bash /opt/jachwi-sunbae/scripts/fetch_env.sh \
  && sudo systemctl restart jachwi-sunbae.service
```

다운로드가 성공했을 때만 재시작한다. `app.env` 삭제나 `systemctl restart`만으로 Vault 다운로드가 실행되는 구성은 아니다.

### 변경 검증

저장소 루트에서 다음 검사를 실행한다.

```bash
bash -n backend/deploy/scripts/prepare_vault.sh
bash -n backend/deploy/scripts/fetch_env.sh
bash -n backend/deploy/scripts/after_install.sh
git diff --check
```

현재까지의 서버 검증은 dev의 직접 실행과 동일한 인스턴스 목록 갱신에 대한 확인이다. 다음 검증에는 dev CodeDeploy 성공, `ValidateService`의 health·SHA 확인, 새 ASG 인스턴스에서의 허용 목록 반영·환경변수 생성·서비스 기동을 포함한다.

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

## GTFS 노선망 적재

생활권 탐색에 쓰는 대중교통 노선망은 배포와 별도로, 운영자가 서버에서 `app.jar`를 적재 모드로 실행해 채운다. 기존 `gtfs_*` 데이터를 모두 지우고 새로 채우며, 실패하면 이전 노선망이 그대로 남는다.

1. RDS에 `db/init/001-schema.sql`의 `gtfs_*` `CREATE TABLE`을 먼저 실행한다. 스키마는 자동으로 반영되지 않는다.
2. KTDB GTFS 파일 5개(`routes.txt`, `trips.txt`, `stop_times.txt`, `stops.txt`, `transfers.txt`)를 EC2에 올리고 `jachwi` 계정이 읽을 수 있게 한다.
3. 서비스와 같은 환경변수로 `app.jar`를 적재 모드로 실행한다.

```bash
sudo bash -c 'set -a; source /etc/jachwi-sunbae/app.env; set +a
  runuser -u jachwi -- java -Xmx512m -jar /opt/jachwi-sunbae/app.jar \
    --spring.main.web-application-type=none \
    --transit.gtfs.import-on-startup=true \
    --transit.gtfs.directory=/path/to/gtfs \
    --logging.file.path=/var/log/jachwi-sunbae/gtfs-import'
echo $?
```

| 옵션 | 이유 |
| --- | --- |
| `web-application-type=none` | 웹 서버를 띄우지 않아 서비스가 쓰는 80 포트와 겹치지 않는다 |
| `transit.gtfs.import-on-startup=true` | `GtfsImportRunner`가 한 번 적재하고 프로세스를 끝낸다 |
| `logging.file.path` | 서비스와 같은 로그 파일을 함께 쓰지 않도록 로그 디렉터리를 나눈다 |
| `-Xmx512m` | 서비스 중인 애플리케이션과 같은 서버에서 도므로 힙을 따로 제한한다 |

종료 코드는 성공 0, 실패 1이며 적재 건수와 실패 원인은 화면과 `/var/log/jachwi-sunbae/gtfs-import/application.log`에 남는다. 전국 데이터는 힙 512MB로 읽는 데 약 40초가 걸린다. dev(`t4g.micro`, 메모리 1GB)는 여유가 적으므로 트래픽이 없을 때 실행한다.

## 로그 확인

```bash
sudo journalctl -u jachwi-sunbae.service -f
sudo systemctl status jachwi-sunbae.service
sudo tail -f /var/log/jachwi-sunbae/application.log
sudo tail -f /var/log/jachwi-sunbae/service-events.log
```

배포 자체가 실패했다면 EC2의 `/opt/codedeploy-agent/deployment-root/deployment-logs/`를 함께 본다.

배포 결과는 관련 GitHub 이슈 또는 PR에 기록한다.
