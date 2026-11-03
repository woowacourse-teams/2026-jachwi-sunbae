// 수집을 시작할 때 SDK와 SDK 초기화 설정을 한 chunk로 함께 불러온다. 둘 다 첫 번들에 넣지 않는다.
export { getPostHogOptions } from './configuration';
export { default } from 'posthog-js';
