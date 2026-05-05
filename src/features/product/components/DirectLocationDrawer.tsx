import { useEffect, useMemo, useState } from "react";
import DrawerLayout from "../../../shared/components/DrawerLayout/DrawerLayout";
import {
  findCities,
  findStates,
  type CityItem,
  type StateItem,
} from "../api/codeapi";
import styles from "./DirectLocationDrawer.module.css";

type DirectLocationDrawerProps = {
  selectedCity: string;
  onBack: () => void;
  onSelectCity: (city: string) => void;
};

type LocationSearchItem = {
  stateId: number;
  stateName: string;
  cityId: number;
  cityName: string;
};

type RecentLocationItem = {
  stateName: string;
  cityName: string;
};

const RECENT_CITY_STORAGE_KEY = "recentProductLocations";

export default function DirectLocationDrawer({
  selectedCity,
  onBack,
  onSelectCity,
}: DirectLocationDrawerProps) {
  const [states, setStates] = useState<StateItem[]>([]);
  const [cities, setCities] = useState<CityItem[]>([]);
  const [keyword, setKeyword] = useState("");
  const [recentLocations, setRecentLocations] = useState<RecentLocationItem[]>(
    [],
  );

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const [stateRes, cityRes] = await Promise.all([
          findStates(),
          findCities(),
        ]);

        setStates(stateRes);
        setCities(cityRes);
      } catch (error) {
        console.error("지역 코드 조회 실패", error);
      }
    };

    fetchLocations();
  }, []);

  useEffect(() => {
    const rawRecentLocations = localStorage.getItem(RECENT_CITY_STORAGE_KEY);

    if (!rawRecentLocations) return;

    try {
      const parsed = JSON.parse(rawRecentLocations);

      if (Array.isArray(parsed)) {
        setRecentLocations(
          parsed.filter(
            (item): item is RecentLocationItem =>
              typeof item === "object" &&
              item !== null &&
              typeof item.stateName === "string" &&
              typeof item.cityName === "string",
          ),
        );
      }
    } catch (error) {
      console.error("최근 지역 파싱 실패", error);
    }
  }, []);

  const locationItems = useMemo<LocationSearchItem[]>(() => {
    return cities.map((city) => {
      const state = states.find((item) => item.ID === city.STATE_ID);

      return {
        stateId: city.STATE_ID,
        stateName: state?.STATE ?? "",
        cityId: city.ID,
        cityName: city.CITY,
      };
    });
  }, [cities, states]);

  const filteredItems = useMemo(() => {
    const trimmedKeyword = keyword.trim();

    if (!trimmedKeyword) return [];

    return locationItems.filter((item) => {
      const fullLocationName = `${item.stateName} ${item.cityName}`;

      return (
        item.cityName.includes(trimmedKeyword) ||
        item.stateName.includes(trimmedKeyword) ||
        fullLocationName.includes(trimmedKeyword)
      );
    });
  }, [keyword, locationItems]);

  const saveRecentLocation = (location: RecentLocationItem) => {
    const nextRecentLocations = [
      location,
      ...recentLocations.filter(
        (item) =>
          !(
            item.stateName === location.stateName &&
            item.cityName === location.cityName
          ),
      ),
    ].slice(0, 5);

    setRecentLocations(nextRecentLocations);
    localStorage.setItem(
      RECENT_CITY_STORAGE_KEY,
      JSON.stringify(nextRecentLocations),
    );
  };

  const removeRecentLocation = (location: RecentLocationItem) => {
    const nextRecentLocations = recentLocations.filter(
      (item) =>
        !(
          item.stateName === location.stateName &&
          item.cityName === location.cityName
        ),
    );

    setRecentLocations(nextRecentLocations);
    localStorage.setItem(
      RECENT_CITY_STORAGE_KEY,
      JSON.stringify(nextRecentLocations),
    );
  };

  const handleSelectLocation = (location: RecentLocationItem) => {
    saveRecentLocation(location);
    onSelectCity(location.cityName);
  };

  return (
    <DrawerLayout title="지역 검색" onBack={onBack}>
      <div className={styles.container}>
        <div className={styles.searchBox}>
          <form
            className={styles.searchForm}
            onSubmit={(event) => event.preventDefault()}
          >
            <label htmlFor="location-search" className={styles.searchLabel}>
              <input
                id="location-search"
                type="search"
                name="location-search"
                placeholder="지역을 검색해 주세요."
                autoComplete="off"
                className={styles.searchInput}
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
              />
            </label>

            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              className={styles.searchIcon}
            >
              <path
                stroke="currentColor"
                d="M11 19C15.4183 19 19 15.4183 19 11C19 6.58172 15.4183 3 11 3C6.58172 3 3 6.58172 3 11C3 15.4183 6.58172 19 11 19Z"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                stroke="currentColor"
                d="M21 21L17 17"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </form>
        </div>

        {!keyword.trim() && (
          <div className={styles.recentSection}>
            <p className={styles.sectionTitle}>최근 검색한 지역</p>

            {recentLocations.length === 0 ? (
              <p className={styles.emptyText}>최근 검색한 지역이 없습니다.</p>
            ) : (
              <div className={styles.recentList}>
                {recentLocations.map((location) => (
                  <div
                    key={`${location.stateName}-${location.cityName}`}
                    className={styles.recentItem}
                  >
                    <button
                      type="button"
                      className={styles.recentCityButton}
                      onClick={() => handleSelectLocation(location)}
                    >
                      <p>
                        {location.stateName} {location.cityName}
                      </p>
                    </button>

                    <button
                      type="button"
                      className={styles.recentRemoveButton}
                      onClick={() => removeRecentLocation(location)}
                      aria-label={`${location.stateName} ${location.cityName} 최근 검색 삭제`}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {keyword.trim() && (
          <div className={styles.resultSection}>
            <p className={styles.resultTitle}>'{keyword.trim()}' 검색결과</p>

            {filteredItems.length === 0 ? (
              <p className={styles.emptyText}>검색 결과가 없습니다.</p>
            ) : (
              <div className={styles.resultList}>
                {filteredItems.map((item) => {
                  const isSelected = selectedCity === item.cityName;

                  return (
                    <button
                      key={item.cityId}
                      type="button"
                      aria-label={`${item.stateName} ${item.cityName}`}
                      className={`${styles.resultButton} ${
                        isSelected ? styles.resultButtonSelected : ""
                      }`}
                      onClick={() =>
                        handleSelectLocation({
                          stateName: item.stateName,
                          cityName: item.cityName,
                        })
                      }
                    >
                      <span aria-hidden="true">{item.stateName}</span>
                      <span aria-hidden="true" className={styles.cityText}>
                        {item.cityName}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </DrawerLayout>
  );
}
