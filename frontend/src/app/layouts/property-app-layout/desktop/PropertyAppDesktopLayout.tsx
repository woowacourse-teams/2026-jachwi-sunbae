import { Outlet } from 'react-router-dom';

import type { Member } from '@/features/auth/model/Member';
import DesktopHeader from '@/shared/ui/desktop-header/DesktopHeader';

import type { AppShellState } from '../appShell';
import { appShellAttributes } from '../appShell';

import * as shared from '../PropertyAppLayout.styles';
import * as styles from './PropertyAppDesktopLayout.styles';

type Props = {
  member: Member;
  shell: AppShellState;
};

/** 데스크탑 앱 셸. 화면 전체 폭에 홈 로고·주요 화면 메뉴가 있는 공용 헤더를 둔다. */
const PropertyAppDesktopLayout = ({ member, shell }: Props) => (
  <div className={`${shared.root} ${styles.root}`} {...appShellAttributes(shell)}>
    <DesktopHeader />
    <div className={`${shared.content} ${styles.content}`}>
      <Outlet context={member} />
    </div>
  </div>
);

export default PropertyAppDesktopLayout;
