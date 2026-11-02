import { http } from 'msw';

import { success } from '../mockStore';

// 로컬 목은 Refresh 쿠키를 흉내 내지 않는다. 페이지를 새로 열면 늘 1번 익명 회원으로 복원하고,
// 초기화하면 회원 번호만 하나씩 올린다. 매물 등 목 데이터는 회원별로 나누지 않는다.
let currentMemberId = 1;

const tokenResponse = (newMember = false) =>
  success({
    accessToken: `local-msw-access-token-${currentMemberId}`,
    tokenType: 'Bearer',
    expiresIn: 900,
    newMember,
    member: { memberId: currentMemberId },
  });

export const authHandlers = [
  http.post('*/api/auth/login', () => tokenResponse()),
  http.post('*/api/auth/refresh', () => tokenResponse()),
  // 지금 Refresh 쿠키를 폐기하고 새 익명 회원을 만든다. 응답은 로그인과 같은 LoginResponse다.
  http.post('*/api/auth/delete', () => {
    currentMemberId += 1;
    return tokenResponse(true);
  }),
  http.get('*/api/members/me', () => success({ id: currentMemberId })),
];
