import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';

import { usePropertyList } from '@/features/property/api/useProperties';
import { ButtonLink } from '@/shared/ui/button/Button';
import SearchField from '@/shared/ui/search-field/SearchField';
import TopNavigation from '@/shared/ui/top-navigation/TopNavigation';

import PropertyListContent from './ui/property-list-content/PropertyListContent';

import styles from './PropertyListPage.module.css';

type PropertyStatusFilter = 'ALL' | 'INCOMPLETE' | 'COMPLETED';

const propertyStatusFilters: Array<{ value: PropertyStatusFilter; label: string }> = [
  { value: 'ALL', label: '전체' },
  { value: 'INCOMPLETE', label: '미완료' },
  { value: 'COMPLETED', label: '완료' },
];

const PropertyListPage = () => {
  const location = useLocation();
  const [draftQuery, setDraftQuery] = useState('');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<PropertyStatusFilter>('ALL');
  const headingRef = useRef<HTMLHeadingElement>(null);
  const properties = usePropertyList();
  const items = properties.data?.pages.flatMap((page) => page.content) ?? [];
  const filteredItems = items.filter((property) => {
    if (query.length > 0 && !property.name.includes(query)) return false;
    if (statusFilter === 'ALL') return true;
    const isCompleted =
      property.progress.totalCount > 0 && property.progress.completedCount === property.progress.totalCount;
    return statusFilter === 'COMPLETED' ? isCompleted : !isCompleted;
  });
  const shouldFocusHeading = (location.state as { focusHeading?: boolean } | null)?.focusHeading === true;

  useEffect(() => {
    if (shouldFocusHeading) headingRef.current?.focus();
  }, [shouldFocusHeading]);

  const search = () => setQuery(draftQuery.trim());
  const propertySearch = (
    <div className={styles.search}>
      <SearchField
        label="매물 이름 검색"
        value={draftQuery}
        maxLength={50}
        placeholder="매물 이름으로 검색"
        showSubmitButton={false}
        onValueChange={setDraftQuery}
        onSubmit={search}
        onClear={() => setQuery('')}
      />
    </div>
  );

  return (
    <main className={styles.page}>
      <div className={styles.content}>
        <TopNavigation
          className={styles.topNavigation}
          title="최근 담은 매물"
          endSlot={
            <ButtonLink className={styles.compareButton} variant="secondary" to="/compare">
              비교표 받기
            </ButtonLink>
          }
        />
        <h1 ref={headingRef} className="sr-only" tabIndex={-1}>
          내 매물
        </h1>

        <div className={styles.searchRow}>{propertySearch}</div>

        {properties.isSuccess && items.length > 0 && (
          <div className={styles.statusFilters} aria-label="매물 진행 상태 필터">
            {propertyStatusFilters.map((filter) => (
              <button
                key={filter.value}
                type="button"
                aria-pressed={statusFilter === filter.value}
                onClick={() => setStatusFilter(filter.value)}
              >
                {filter.label}
              </button>
            ))}
          </div>
        )}

        <PropertyListContent properties={properties} items={items} filteredItems={filteredItems} query={query} />
      </div>
    </main>
  );
};

export default PropertyListPage;
