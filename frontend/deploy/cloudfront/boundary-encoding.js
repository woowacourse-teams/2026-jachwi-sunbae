// CloudFront Function(viewer request, cloudfront-js-2.0). 콘솔이나 CLI로 배포에 연결한다(docs/deployment.md).
// 시도별 경계 파일을 brotli를 받을 수 있는 브라우저에는 `.geojson.br` 객체로, 나머지에는 gzip 객체로 보낸다.
// S3 객체는 Content-Encoding이 고정이라 CloudFront가 Accept-Encoding에 맞춰 골라 주지 못하므로 주소를 바꿔 고른다.
// 캐시 키는 바뀐 주소로 잡히므로 캐시 정책에 Accept-Encoding을 넣지 않아도 두 응답이 섞이지 않는다.
var BOUNDARY_FILE = /^\/boundaries\/admin-dongs\.\d{2}\.\d{8}\.[a-f0-9]{12}\.geojson$/;

function acceptsBrotli(header) {
  if (!header) return false;
  var codings = header.value.toLowerCase().split(',');
  for (var i = 0; i < codings.length; i += 1) {
    var parts = codings[i].trim().split(';');
    if (parts[0].trim() !== 'br') continue;
    // `br;q=0`은 받지 않겠다는 뜻이다.
    var weight = parts.length > 1 ? /^\s*q=([0-9.]+)\s*$/.exec(parts[1]) : null;
    return weight === null || Number(weight[1]) > 0;
  }
  return false;
}

// CloudFront가 `handler`라는 이름으로 부른다.
function handler(event) {
  var request = event.request;
  if (BOUNDARY_FILE.test(request.uri) && acceptsBrotli(request.headers['accept-encoding'])) request.uri += '.br';
  return request;
}
