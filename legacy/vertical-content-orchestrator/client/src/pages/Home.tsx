import { useLocation } from "wouter";
import {
  ActivityPage,
  ContentBank,
  Integrations,
  Overview,
  Publications,
  ReviewQueue,
  SchedulePage,
} from "./HomeSections";

export default function Home() {
  const [location] = useLocation();
  const content =
    location === "/content" ? (
      <ContentBank />
    ) : location === "/review" ? (
      <ReviewQueue />
    ) : location === "/schedule" ? (
      <SchedulePage />
    ) : location === "/publications" ? (
      <Publications />
    ) : location === "/activity" ? (
      <ActivityPage />
    ) : location === "/integrations" ? (
      <Integrations />
    ) : (
      <Overview />
    );

  return <div className="mx-auto w-full max-w-[1500px]">{content}</div>;
}
