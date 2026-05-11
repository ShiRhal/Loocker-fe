import { useEffect, useMemo, useState } from "react";
import { codeApi } from "../api/codeApi";
import type {
  CityCodeResponse,
  MainCategoryResponse,
  StateCodeResponse,
  SubCategoryResponse,
} from "../api/codeApi";

export type SelectOption = {
  value: string;
  label: string;
};

export function useCodeOptions() {
  const [states, setStates] = useState<StateCodeResponse[]>([]);
  const [cities, setCities] = useState<CityCodeResponse[]>([]);
  const [mainCategories, setMainCategories] = useState<MainCategoryResponse[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategoryResponse[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadCodes() {
      try {
        setLoading(true);
        setError(null);

        const [stateRes, cityRes, mainCategoryRes, subCategoryRes] =
          await Promise.all([
            codeApi.getStates(),
            codeApi.getCities(),
            codeApi.getMainCategories(),
            codeApi.getSubCategories(),
          ]);

        if (!mounted) return;

        setStates(stateRes);
        setCities(cityRes);
        setMainCategories(mainCategoryRes);
        setSubCategories(subCategoryRes);
      } catch (err) {
        if (!mounted) return;
        setError(err instanceof Error ? err : new Error("코드 조회 실패"));
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadCodes();

    return () => {
      mounted = false;
    };
  }, []);

  const stateOptions = useMemo<SelectOption[]>(
    () =>
      states.map((state) => ({
        value: state.CODE,
        label: state.STATE,
      })),
    [states],
  );

  const cityOptions = useMemo<SelectOption[]>(
    () =>
      cities.map((city) => ({
        value: city.CODE,
        label: city.CITY,
      })),
    [cities],
  );

  const mainCategoryOptions = useMemo<SelectOption[]>(
    () =>
      mainCategories.map((category) => ({
        value: String(category.ID),
        label: category.MAIN_CATEGORY,
      })),
    [mainCategories],
  );

  const subCategoryOptions = useMemo<SelectOption[]>(
    () =>
      subCategories.map((category) => ({
        value: String(category.ID),
        label: category.SUB_CATEGORY,
      })),
    [subCategories],
  );

  function getCityOptionsByStateId(stateId?: number | null): SelectOption[] {
    if (!stateId) return cityOptions;

    return cities
      .filter((city) => city.STATE_ID === stateId)
      .map((city) => ({
        value: city.CODE,
        label: city.CITY,
      }));
  }

  function getSubCategoryOptionsByMainId(mainId?: number | null): SelectOption[] {
    if (!mainId) return subCategoryOptions;

    return subCategories
      .filter((category) => category.MAIN_ID === mainId)
      .map((category) => ({
        value: String(category.ID),
        label: category.SUB_CATEGORY,
      }));
  }

  return {
    loading,
    error,

    states,
    cities,
    mainCategories,
    subCategories,

    stateOptions,
    cityOptions,
    mainCategoryOptions,
    subCategoryOptions,

    getCityOptionsByStateId,
    getSubCategoryOptionsByMainId,
  };
}