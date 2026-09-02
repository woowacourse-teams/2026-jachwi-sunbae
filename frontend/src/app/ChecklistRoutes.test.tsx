import { QueryClientProvider } from '@tanstack/react-query';
import { StrictMode } from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HttpResponse, http } from 'msw';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import {
  checkItemPageFixture,
  checklistPageFixture,
  checklistSummaryFixture,
  onlineItemFixture,
  secondChecklistSummaryFixture,
  secondOnlineItemFixture,
} from '../test/checklistFixtures';
import { propertyDetailResponseFixture, successEnvelope } from '../test/propertyFixtures';
import { server } from '../test/server';
import type { PublicConfig } from '../types/PublicConfig';
import AppRoutes from './AppRoutes';
import { setAuthentication } from './authStore';
import { queryClient } from './queryClient';
import { readLastSelectedChecklist } from './lastChecklistStore';

const config: PublicConfig = {
  apiBaseUrl: 'http://localhost:8080',
};

type TestEntry = string | { pathname: string; state?: unknown };

const renderAuthenticated = (entry: TestEntry) => {
  setAuthentication({ accessToken: 'memory-token', tokenType: 'Bearer', expiresIn: 60 });
  return render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[entry]}>
          <AppRoutes config={config} />
        </MemoryRouter>
      </QueryClientProvider>
    </StrictMode>,
  );
};

const onSiteChecklistSummary = { ...checklistSummaryFixture, stage: 'ON_SITE' };
const secondOnSiteChecklistSummary = { ...secondChecklistSummaryFixture, stage: 'ON_SITE' };
const onSiteItemFixture = { ...onlineItemFixture, stage: 'ON_SITE' };
const secondOnSiteItemFixture = { ...secondOnlineItemFixture, stage: 'ON_SITE' };

const finalChecklistDetail = (overrides: Record<string, unknown> = {}) => ({
  id: 7,
  name: '전화 문의 기본 목록',
  stage: 'ONLINE_PHONE',
  itemCount: 2,
  items: [
    {
      id: 701,
      origin: 'PROVIDED',
      systemCheckItemId: 101,
      itemType: 'CORE',
      question: onlineItemFixture.question,
      displayOrder: 1,
      active: true,
    },
    {
      id: 702,
      origin: 'PROVIDED',
      systemCheckItemId: 102,
      itemType: 'OPTIONAL',
      question: secondOnlineItemFixture.question,
      displayOrder: 2,
      active: true,
    },
  ],
  ...overrides,
});

const emptyStageProgress = (stage: 'ON_SITE' | 'PRE_CONTRACT') => ({
  stage,
  applied: false,
  propertyChecklistId: null,
  checklistName: null,
  sourceChecklistId: null,
  progress: {
    totalCount: 0,
    completedCount: 0,
    goodCount: 0,
    cautionCount: 0,
    unconfirmedCount: 0,
    progressRate: 0,
  },
});

describe('체크리스트 탐색과 편집', () => {
  it('체크리스트 홈 접속 시 현장 체크리스트 목록으로 이동한다', async () => {
    server.use(
      http.get(`${config.apiBaseUrl}/api/checklists`, () =>
        HttpResponse.json(successEnvelope(checklistPageFixture([]))),
      ),
    );
    renderAuthenticated('/checklists');

    expect(await screen.findByRole('heading', { name: '체크리스트' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '체크리스트' })).toHaveAttribute('aria-current', 'page');
  });

  it('빈 단계에서는 별도 빈 카드 없이 새 체크리스트 만들기 링크를 제공한다', async () => {
    server.use(
      http.get(`${config.apiBaseUrl}/api/checklists`, () =>
        HttpResponse.json(successEnvelope(checklistPageFixture([]))),
      ),
    );
    renderAuthenticated('/checklists');

    expect(await screen.findByRole('link', { name: '새 체크리스트 만들기' })).toHaveAttribute(
      'href',
      '/checklists/new',
    );
    expect(screen.queryByText('이 단계에 만든 체크리스트가 없어요.')).not.toBeInTheDocument();
  });

  it('체크리스트 목록 최초 요청 실패 후 다시 시도하면 목록을 표시한다', async () => {
    let shouldFail = true;
    server.use(
      http.get(`${config.apiBaseUrl}/api/checklists`, () =>
        shouldFail
          ? HttpResponse.error()
          : HttpResponse.json(successEnvelope(checklistPageFixture([onSiteChecklistSummary]))),
      ),
    );
    const user = userEvent.setup();
    renderAuthenticated('/checklists');

    expect(await screen.findByText('체크리스트를 불러오지 못했어요.')).toBeInTheDocument();
    shouldFail = false;
    await user.click(screen.getByRole('button', { name: '다시 시도' }));

    expect(await screen.findByRole('link', { name: '전화 문의 기본 목록 편집' })).toBeInTheDocument();
  });

  it('단계 목록에 편집과 삭제 동작을 함께 표시한다', async () => {
    server.use(
      http.get(`${config.apiBaseUrl}/api/checklists`, () =>
        HttpResponse.json(
          successEnvelope(checklistPageFixture([onSiteChecklistSummary, secondOnSiteChecklistSummary])),
        ),
      ),
    );
    renderAuthenticated('/checklists');

    expect(await screen.findByRole('link', { name: '전화 문의 기본 목록 편집' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '전화 문의 기본 목록 삭제' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '직방 매물 문의 목록 편집' })).toBeInTheDocument();
  });

  it('새 체크리스트는 CORE로 열리고 제공 OPTIONAL을 추가한다', async () => {
    let requestBody: unknown;
    server.use(
      http.get(`${config.apiBaseUrl}/api/check-items`, () =>
        HttpResponse.json(successEnvelope(checkItemPageFixture([onSiteItemFixture, secondOnSiteItemFixture]))),
      ),
      http.post(`${config.apiBaseUrl}/api/checklists`, async ({ request }) => {
        requestBody = await request.json();
        return HttpResponse.json(
          successEnvelope(finalChecklistDetail({ id: 9, name: '원룸 집에서 확인 체크리스트', stage: 'ON_SITE' })),
          { status: 201 },
        );
      }),
    );
    const user = userEvent.setup();
    renderAuthenticated('/checklists/new');

    expect(await screen.findByLabelText('체크리스트 이름')).toHaveValue('원룸 집에서 확인 체크리스트');
    expect(screen.getByText(onlineItemFixture.question)).toBeInTheDocument();
    expect(screen.queryByText(secondOnlineItemFixture.question)).not.toBeInTheDocument();
    expect(screen.queryByText('빈 목록')).not.toBeInTheDocument();
    expect(screen.queryByText('원룸 제공 항목')).not.toBeInTheDocument();

    const addItemButton = screen.getByRole('button', { name: '체크 항목 추가' });
    const createButton = screen.getByRole('button', { name: '체크리스트 만들기' });
    const orderHeading = screen.getByRole('heading', { name: '확인 순서' });
    expect(addItemButton.compareDocumentPosition(orderHeading) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(createButton.compareDocumentPosition(orderHeading) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    await user.click(addItemButton);
    const optionalItem = await screen.findByRole('checkbox', { name: secondOnlineItemFixture.question });
    const cancelButton = screen.getByRole('button', { name: '취소' });
    const addSelectedButton = screen.getByRole('button', { name: '선택한 0개 항목 추가' });
    const searchResultsHeading = screen.getByRole('heading', { name: '검색 결과' });
    expect(cancelButton.compareDocumentPosition(searchResultsHeading) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(
      addSelectedButton.compareDocumentPosition(searchResultsHeading) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(optionalItem).not.toBeChecked();
    expect(screen.queryByLabelText('내 질문 직접 추가')).not.toBeInTheDocument();
    await user.click(optionalItem);
    await user.click(screen.getByRole('button', { name: '선택한 1개 항목 추가' }));
    expect(screen.getByText(secondOnlineItemFixture.question)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '체크리스트 만들기' }));
    await waitFor(() =>
      expect(requestBody).toEqual({
        name: '원룸 집에서 확인 체크리스트',
        stage: 'ON_SITE',
        items: [{ systemCheckItemId: 101 }, { systemCheckItemId: 102 }],
      }),
    );
    expect(await screen.findByRole('link', { name: '새 체크리스트 만들기' })).toHaveAttribute(
      'href',
      '/checklists/new',
    );
  });

  it('원룸 제공 항목을 불러오지 못하면 빈 목록으로 우회하지 않고 재시도한다', async () => {
    server.use(
      http.get(`${config.apiBaseUrl}/api/check-items`, () =>
        HttpResponse.json({ code: 'INTERNAL_SERVER_ERROR', message: '조회 실패', data: null }, { status: 503 }),
      ),
    );
    renderAuthenticated('/checklists/new');

    const error = await screen.findByRole('alert');
    expect(within(error).getByText('프리셋을 불러오지 못했어요.')).toBeInTheDocument();
    expect(within(error).getByRole('button', { name: '다시 시도' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '빈 목록으로 시작' })).not.toBeInTheDocument();
    expect(screen.queryByLabelText('체크리스트 이름')).not.toBeInTheDocument();
  });

  it('수정 요청에는 현재 제공 항목의 전체 순서를 보낸다', async () => {
    let requestBody: unknown;
    server.use(
      http.get(`${config.apiBaseUrl}/api/checklists/7`, () =>
        HttpResponse.json(successEnvelope(finalChecklistDetail())),
      ),
      http.get(`${config.apiBaseUrl}/api/check-items`, () =>
        HttpResponse.json(successEnvelope(checkItemPageFixture([onlineItemFixture, secondOnlineItemFixture]))),
      ),
      http.put(`${config.apiBaseUrl}/api/checklists/7`, async ({ request }) => {
        requestBody = await request.json();
        return HttpResponse.json(successEnvelope(finalChecklistDetail({ name: '수정한 목록' })));
      }),
    );
    const user = userEvent.setup();
    renderAuthenticated('/checklists/7');

    const name = await screen.findByLabelText('체크리스트 이름');
    await user.clear(name);
    await user.type(name, '수정한 목록');
    await user.click(screen.getByRole('button', { name: '변경 내용 저장' }));

    await waitFor(() =>
      expect(requestBody).toEqual({
        name: '수정한 목록',
        items: [{ systemCheckItemId: 101 }, { systemCheckItemId: 102 }],
      }),
    );
    expect(await screen.findByRole('link', { name: '새 체크리스트 만들기' })).toHaveAttribute(
      'href',
      '/checklists/new',
    );
  });
});

describe('매물 체크리스트 연결과 자동 저장', () => {
  it('매물에 체크리스트가 없으면 선택 화면 없이 바로 기본 체크리스트 시작 버튼을 보여준다', async () => {
    server.use(
      http.get(`${config.apiBaseUrl}/api/properties/10`, () =>
        HttpResponse.json(successEnvelope({ ...propertyDetailResponseFixture(), photos: [] })),
      ),
      http.get(`${config.apiBaseUrl}/api/properties/10/checklists`, () =>
        HttpResponse.json(
          successEnvelope({
            propertyId: 10,
            overallProgress: {
              totalCount: 2,
              completedCount: 1,
              goodCount: 1,
              cautionCount: 0,
              unconfirmedCount: 1,
              progressRate: 50,
            },
            stages: [
              {
                stage: 'ONLINE_PHONE',
                applied: true,
                propertyChecklistId: 47,
                checklistName: '전화 문의 기본 목록',
                sourceChecklistId: 7,
                progress: {
                  totalCount: 2,
                  completedCount: 1,
                  goodCount: 1,
                  cautionCount: 0,
                  unconfirmedCount: 1,
                  progressRate: 50,
                },
              },
              emptyStageProgress('ON_SITE'),
              emptyStageProgress('PRE_CONTRACT'),
            ],
          }),
        ),
      ),
    );
    renderAuthenticated('/properties/10');

    const sectionHeading = await screen.findByRole('heading', { name: '체크리스트' });
    const section = sectionHeading.closest('section');
    expect(section).not.toBeNull();
    expect(within(section as HTMLElement).getByRole('button', { name: /^체크리스트$/ })).toBeInTheDocument();
  });

  it('내 체크리스트가 없어도 시작 방식 선택 없이 새 체크리스트 만들기만 제공한다', async () => {
    server.use(
      http.get(`${config.apiBaseUrl}/api/properties/10`, () =>
        HttpResponse.json(successEnvelope(propertyDetailResponseFixture())),
      ),
      http.get(`${config.apiBaseUrl}/api/properties/10/checklists`, () =>
        HttpResponse.json(
          successEnvelope({
            propertyId: 10,
            overallProgress: {
              totalCount: 0,
              completedCount: 0,
              goodCount: 0,
              cautionCount: 0,
              unconfirmedCount: 0,
              progressRate: 0,
            },
            stages: [
              {
                stage: 'ONLINE_PHONE',
                applied: false,
                propertyChecklistId: null,
                checklistName: null,
                sourceChecklistId: null,
                progress: {
                  totalCount: 0,
                  completedCount: 0,
                  goodCount: 0,
                  cautionCount: 0,
                  unconfirmedCount: 0,
                  progressRate: 0,
                },
              },
              emptyStageProgress('ON_SITE'),
              emptyStageProgress('PRE_CONTRACT'),
            ],
          }),
        ),
      ),
      http.get(`${config.apiBaseUrl}/api/checklists`, () =>
        HttpResponse.json(successEnvelope(checklistPageFixture([]))),
      ),
    );
    renderAuthenticated('/properties/10/active-checklists/ONLINE_PHONE?from=property-detail');

    expect(await screen.findByRole('checkbox', { name: /자취선배 기본 체크리스트/ })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: '새 체크리스트 만들기' })).not.toBeInTheDocument();
    expect(screen.queryByText('빈 목록')).not.toBeInTheDocument();
    expect(screen.queryByText('원룸 제공 항목')).not.toBeInTheDocument();
  });

  it('목록을 고른 뒤 확인할 때 최종 연결 API를 호출하고 적용 상세로 이동한다', async () => {
    let requestBody: unknown;
    server.use(
      http.get(`${config.apiBaseUrl}/api/properties/10`, () =>
        HttpResponse.json(successEnvelope(propertyDetailResponseFixture())),
      ),
      http.get(`${config.apiBaseUrl}/api/properties/10/checklists`, () =>
        HttpResponse.json(
          successEnvelope({
            propertyId: 10,
            overallProgress: {
              totalCount: 0,
              completedCount: 0,
              goodCount: 0,
              cautionCount: 0,
              unconfirmedCount: 0,
              progressRate: 0,
            },
            stages: [
              {
                stage: 'ONLINE_PHONE',
                applied: false,
                propertyChecklistId: null,
                checklistName: null,
                sourceChecklistId: null,
                progress: {
                  totalCount: 0,
                  completedCount: 0,
                  goodCount: 0,
                  cautionCount: 0,
                  unconfirmedCount: 0,
                  progressRate: 0,
                },
              },
              emptyStageProgress('ON_SITE'),
              emptyStageProgress('PRE_CONTRACT'),
            ],
          }),
        ),
      ),
      http.get(`${config.apiBaseUrl}/api/checklists`, () =>
        HttpResponse.json(successEnvelope(checklistPageFixture([checklistSummaryFixture]))),
      ),
      http.put(`${config.apiBaseUrl}/api/properties/10/checklists/ONLINE_PHONE`, async ({ request }) => {
        requestBody = await request.json();
        return HttpResponse.json(
          successEnvelope({
            id: 47,
            propertyId: 10,
            sourceChecklistId: 7,
            checklistName: '전화 문의 기본 목록',
            stage: 'ONLINE_PHONE',
            items: [],
          }),
        );
      }),
      http.get(`${config.apiBaseUrl}/api/properties/10/checklists/47`, () =>
        HttpResponse.json(
          successEnvelope({
            id: 47,
            propertyId: 10,
            sourceChecklistId: 7,
            checklistName: '전화 문의 기본 목록',
            stage: 'ONLINE_PHONE',
            items: [],
          }),
        ),
      ),
      http.get(`${config.apiBaseUrl}/api/properties/10/checklists`, () =>
        HttpResponse.json(
          successEnvelope({
            propertyId: 10,
            overallProgress: {
              totalCount: 2,
              completedCount: 1,
              goodCount: 1,
              cautionCount: 0,
              unconfirmedCount: 1,
              progressRate: 50,
            },
            stages: [
              {
                stage: 'ONLINE_PHONE',
                applied: true,
                propertyChecklistId: 47,
                checklistName: '전화 문의 기본 목록',
                sourceChecklistId: 7,
                progress: {
                  totalCount: 1,
                  completedCount: 0,
                  goodCount: 0,
                  cautionCount: 0,
                  unconfirmedCount: 1,
                  progressRate: 0,
                },
              },
              emptyStageProgress('ON_SITE'),
              emptyStageProgress('PRE_CONTRACT'),
            ],
          }),
        ),
      ),
    );
    const user = userEvent.setup();
    renderAuthenticated('/properties/10/active-checklists/ONLINE_PHONE?mode=replace');

    expect(await screen.findByRole('checkbox', { name: /전화 문의 기본 목록/ })).toBeInTheDocument();

    await user.click(screen.getByRole('checkbox', { name: /전화 문의 기본 목록/ }));
    expect(requestBody).toBeUndefined();
    await user.click(screen.getByRole('button', { name: '체크리스트 적용' }));

    await waitFor(() => expect(requestBody).toEqual({ sourceType: 'USER', checklistId: 7 }));
    expect(await screen.findByRole('heading', { name: '전화 문의 기본 목록', level: 1 })).toBeInTheDocument();
    // 다음 매물은 이번에 고른 목록으로 시작한다.
    expect(readLastSelectedChecklist()).toBe(7);
  });

  it('적용된 체크리스트에서 변경을 누르면 현재 연결을 유지한 채 교체 목록을 보여준다', async () => {
    server.use(
      http.get(`${config.apiBaseUrl}/api/properties/10`, () =>
        HttpResponse.json(successEnvelope(propertyDetailResponseFixture())),
      ),
      http.get(`${config.apiBaseUrl}/api/properties/10/checklists`, () =>
        HttpResponse.json(
          successEnvelope({
            propertyId: 10,
            overallProgress: {
              totalCount: 2,
              completedCount: 1,
              goodCount: 1,
              cautionCount: 0,
              unconfirmedCount: 1,
              progressRate: 50,
            },
            stages: [
              {
                stage: 'ONLINE_PHONE',
                applied: true,
                propertyChecklistId: 47,
                checklistName: '전화 문의 기본 목록',
                sourceChecklistId: 7,
                progress: {
                  totalCount: 2,
                  completedCount: 1,
                  goodCount: 1,
                  cautionCount: 0,
                  unconfirmedCount: 1,
                  progressRate: 50,
                },
              },
              emptyStageProgress('ON_SITE'),
              emptyStageProgress('PRE_CONTRACT'),
            ],
          }),
        ),
      ),
      http.get(`${config.apiBaseUrl}/api/checklists`, () =>
        HttpResponse.json(
          successEnvelope(checklistPageFixture([checklistSummaryFixture, secondChecklistSummaryFixture])),
        ),
      ),
    );
    const user = userEvent.setup();
    renderAuthenticated('/properties/10/active-checklists/ONLINE_PHONE?from=property-detail&mode=replace');

    const current = await screen.findByRole('checkbox', { name: /전화 문의 기본 목록/ });
    expect(current).toBeChecked();
    expect(screen.getByRole('checkbox', { name: /직방 매물 문의 목록/ })).not.toBeChecked();

    await user.click(screen.getByRole('checkbox', { name: /직방 매물 문의 목록/ }));
    expect(screen.getByRole('button', { name: '선택한 체크리스트로 교체' })).toBeEnabled();
  });

  it('상태를 선택하면 즉시 저장하고 항목 메모 UI는 제공하지 않는다', async () => {
    let statusRequest: unknown;
    server.use(
      http.get(`${config.apiBaseUrl}/api/properties/10`, () =>
        HttpResponse.json(successEnvelope({ ...propertyDetailResponseFixture(), photos: [] })),
      ),
      http.get(`${config.apiBaseUrl}/api/properties/10/checklists/47`, () =>
        HttpResponse.json(
          successEnvelope({
            id: 47,
            propertyId: 10,
            sourceChecklistId: 7,
            checklistName: '전화 문의 기본 목록',
            stage: 'ON_SITE',
            items: [
              {
                id: 701,
                systemCheckItemId: 101,
                question: '수압이 충분한가요?',
                displayOrder: 1,
                status: 'UNCONFIRMED',
                memo: '',
              },
            ],
          }),
        ),
      ),
      http.get(`${config.apiBaseUrl}/api/properties/10/checklists`, () =>
        HttpResponse.json(
          successEnvelope({
            propertyId: 10,
            overallProgress: {
              totalCount: 1,
              completedCount: 0,
              goodCount: 0,
              cautionCount: 0,
              unconfirmedCount: 1,
              progressRate: 0,
            },
            stages: [
              {
                stage: 'ONLINE_PHONE',
                applied: true,
                propertyChecklistId: 47,
                checklistName: '전화 문의 기본 목록',
                sourceChecklistId: 7,
                progress: {
                  totalCount: 1,
                  completedCount: 0,
                  goodCount: 0,
                  cautionCount: 0,
                  unconfirmedCount: 1,
                  progressRate: 0,
                },
              },
              emptyStageProgress('ON_SITE'),
              emptyStageProgress('PRE_CONTRACT'),
            ],
          }),
        ),
      ),
      http.patch(`${config.apiBaseUrl}/api/properties/10/checklists/47/items/701/status`, async ({ request }) => {
        statusRequest = await request.json();
        return HttpResponse.json(successEnvelope({ item: { id: 701, status: 'CAUTION' } }));
      }),
    );
    const user = userEvent.setup();
    renderAuthenticated('/properties/10/checklists/47');

    expect(await screen.findByRole('heading', { name: '전화 문의 기본 목록', level: 1 })).toBeInTheDocument();
    // 적용한 체크리스트를 바꾸는 진입점은 상단 헤더 오른쪽의 `편집` 하나뿐이다.
    expect(screen.getByRole('link', { name: '편집' })).toHaveAttribute(
      'href',
      '/properties/10/active-checklists/ON_SITE?mode=replace',
    );

    await user.click(screen.getByRole('radio', { name: '주의' }));
    await waitFor(() => expect(statusRequest).toEqual({ status: 'CAUTION' }));
    expect(screen.queryByRole('button', { name: '수압이 충분한가요? 메모 열기' })).not.toBeInTheDocument();
  });
});
