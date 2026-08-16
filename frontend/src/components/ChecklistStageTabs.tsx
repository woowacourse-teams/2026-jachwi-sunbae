import { checklistStageMeta } from '../constants/checklist';
import { CHECKLIST_STAGES } from '../types/Checklist';
import type { ChecklistStage } from '../types/Checklist';
import { Tab, TabList, Tabs } from './ui/Tabs';

type ChecklistStageTabsProps = {
  stage: ChecklistStage;
  getTo?: (stage: ChecklistStage) => string;
};

const ChecklistStageTabs = ({ stage, getTo = (nextStage) => `/checklists/${nextStage}` }: ChecklistStageTabsProps) => (
  <Tabs>
    <TabList label="체크리스트 단계">
      {CHECKLIST_STAGES.map((item) => (
        <Tab key={item} to={getTo(item)} selected={stage === item}>
          {checklistStageMeta[item].shortLabel}
        </Tab>
      ))}
    </TabList>
  </Tabs>
);

export default ChecklistStageTabs;
