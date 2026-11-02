import { render, screen } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it } from 'vitest';

import RouteLoading from '@/app/router/RouteLoading';
import HomePageSkeleton from '@/pages/design-home/HomePageSkeleton';

it('페이지 전체를 바꾸는 로딩은 늦추지 않고 바로 진행 표시를 보여 준다', () => {
  render(<RouteLoading />);
  const loading = screen.getByRole('progressbar').parentElement as HTMLElement;
  const style = getComputedStyle(loading);
  expect(style.opacity).not.toBe('0');
  expect(style.animation).toBe('');
});

it('홈 뼈대는 index.html의 앱 뼈대와 마크업이 같아, JS를 받기 전부터 React가 그린 뒤까지 모양이 그대로다', () => {
  const html = readFileSync(resolve(__dirname, '../../../index.html'), 'utf8');
  const bootSkeleton = html.match(/<div class="boot-skeleton[\s\S]*?<\/span><\/div><\/div>/)?.[0];
  expect(bootSkeleton).toBeDefined();
  expect(renderToStaticMarkup(<HomePageSkeleton />)).toBe(bootSkeleton);
});
