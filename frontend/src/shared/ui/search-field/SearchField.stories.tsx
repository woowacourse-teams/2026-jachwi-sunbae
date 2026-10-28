import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { useArgs } from 'storybook/preview-api';
import { fn } from 'storybook/test';

import SearchField from './SearchField';

const meta = {
  title: '공용/SearchField',
  component: SearchField,
  args: {
    label: '주소 검색',
    value: '',
    placeholder: '도로명 또는 지번 주소',
    shape: 'rounded',
    disabled: false,
    showSubmitButton: true,
    renderAsForm: true,
    onValueChange: fn(),
    onSubmit: fn(),
    onClear: fn(),
  },
  argTypes: {
    label: { description: '화면에는 숨기고 화면 낭독기가 읽는 입력칸 이름' },
    value: { description: '입력한 검색어. 입력하면 컨트롤 값도 함께 바뀐다.' },
    shape: {
      control: 'inline-radio',
      options: ['rounded', 'pill'],
      description: '`pill`은 지도 위에 띄우는 알약 모양',
    },
    maxLength: { control: { type: 'number', min: 1 } },
    showSubmitButton: { description: '오른쪽 "검색" 버튼을 그릴지' },
    onBack: { control: false, description: '주면 돋보기 대신 뒤로 가기 버튼을 그린다.' },
    onValueChange: { control: false },
    onSubmit: { control: false },
    onClear: { control: false },
  },
  // 입력한 값을 args에 되돌려 써서 컨트롤 패널과 입력칸이 같은 값을 보게 한다.
  render: function ControlledSearch(args) {
    const [, updateArgs] = useArgs<typeof args>();
    return (
      <SearchField
        {...args}
        onValueChange={(value) => {
          args.onValueChange(value);
          updateArgs({ value });
        }}
      />
    );
  },
} satisfies Meta<typeof SearchField>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const MapSearch: Story = {
  args: { shape: 'pill', showSubmitButton: false, onBack: fn() },
};
export const Disabled: Story = { args: { value: '서울시청', disabled: true } };
