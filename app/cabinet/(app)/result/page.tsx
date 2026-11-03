import { Suspense } from "react";
import TestResultView from "@/components/cabinet/TestResultView";

/** Результат полного теста: /cabinet/result/?id=… — id в адресе, потому что
 *  статический экспорт не умеет динамические сегменты без списка заранее. */
export default function ResultPage() {
  return (
    <Suspense>
      <TestResultView />
    </Suspense>
  );
}
