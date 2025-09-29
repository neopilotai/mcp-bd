"use client";

import { AdCard } from "@/components/ad-card";
import { RuleCard } from "@/components/rule-card";
import { RuleCardSmall } from "@/components/rule-card-small";
import { ads } from "@/data/ads";
import type { Section } from "@mcp-bd/data/rules";
import Link from "next/link";
import { useQueryState } from "nuqs";
import { Fragment, useEffect, useState } from "react";
import slugify from "slugify";
import { AdCardSmall } from "./ad-card-small";
import { Button } from "./ui/button";

const ITEMS_PER_PAGE = 6;

export function RuleList({
  sections,
  small,
  showViewAll,
}: {
  sections: Section[];
  small?: boolean;
  showViewAll?: boolean;
}) {
  const [search, setSearch] = useQueryState("q");
  const [visibleItems, setVisibleItems] = useState(ITEMS_PER_PAGE);
  const [randomAds, setRandomAds] = useState<Record<string, (typeof ads)[0]>>(
    {},
  );
  const [isMounted, setIsMounted] = useState(false);

  // Set mounted state
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Generate random ads after component mounts on client
  useEffect(() => {
    const newRandomAds: Record<string, (typeof ads)[0]> = {};
    sections.forEach((section, sectionIndex) => {
      section.rules.forEach((_, ruleIndex) => {
        const position = `${sectionIndex}-${ruleIndex}`;
        if (!randomAds[position]) {
          const randomIndex = Math.floor(Math.random() * ads.length);
          newRandomAds[position] = ads[randomIndex];
        } else {
          newRandomAds[position] = randomAds[position];
        }
      });
    });
    setRandomAds(newRandomAds);
  }, [sections]);

  // Reset visible items when search changes
  useEffect(() => {
    setVisibleItems(ITEMS_PER_PAGE);
  }, [search]);

  const filteredSections = sections
    .map((section) => ({
      ...section,
      rules: section.rules.filter(
        (rule) =>
          !search ||
          rule.title.toLowerCase().includes(search.toLowerCase()) ||
          rule.content.toLowerCase().includes(search.toLowerCase()),
      ),
    }))
    .filter((section) => section.rules.length > 0);

  const handleScroll = () => {
    const bottom =
      Math.ceil(window.innerHeight + window.scrollY) >=
      document.documentElement.scrollHeight;

    if (bottom && visibleItems < filteredSections.length) {
      setVisibleItems((prev) =>
        Math.min(prev + ITEMS_PER_PAGE, filteredSections.length),
      );
    }
  };

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  const getRandomAd = (sectionIndex: number, ruleIndex: number) => {
    const position = `${sectionIndex}-${ruleIndex}`;
    return randomAds[position] || ads[0];
  };

  let totalItemsCount = 0;

  if (!filteredSections.length) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="flex-col gap-4 flex items-center">
          <p className="text-[#878787] text-sm">No rules found</p>
          <Button
            variant="outline"
            className="mt-2 border-border rounded-full"
            onClick={() => setSearch(null)}
          >
            Clear search
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      {filteredSections.slice(0, visibleItems).map((section, idx) => (
        <section key={section.tag} id={section.tag}>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-regular">{section.tag}</h3>
            {showViewAll && (
              <Link
                href={`/rules/${slugify(section.tag, { lower: true })}`}
                className="text-sm text-[#878787] flex items-center gap-1"
              >
                <span>View all</span>
                <svg
                  width="12"
                  height="13"
                  viewBox="0 0 12 13"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <mask
                    id="mask0_106_981"
                    maskUnits="userSpaceOnUse"
                    x="0"
                    y="0"
                    width="12"
                    height="13"
                  >
                    <rect y="0.5" width="12" height="12" fill="#D9D9D9" />
                  </mask>
                  <g mask="url(#mask0_106_981)">
                    <path
                      d="M3.2 9.5L2.5 8.8L7.3 4H3V3H9V9H8V4.7L3.2 9.5Z"
                      fill="#878787"
                    />
                  </g>
                </svg>
              </Link>
            )}
          </div>
          <div
            className={`grid grid-cols-1 gap-6 mb-8 ${
              small ? "lg:grid-cols-4" : "lg:grid-cols-2 xl:grid-cols-3"
            }`}
          >
            {section.rules.map((rule, idx2) => {
              totalItemsCount++;
              const shouldShowAd =
                totalItemsCount % 9 === 2 ||
                (totalItemsCount > 2 && (totalItemsCount - 2) % 9 === 0);

              return (
                <Fragment key={`${idx}-${idx2.toString()}`}>
                  {small ? (
                    <>
                      <RuleCardSmall rule={rule} small />
                      {isMounted && shouldShowAd && (
                        <AdCardSmall ad={getRandomAd(idx, idx2)} small />
                      )}
                    </>
                  ) : (
                    <>
                      <RuleCard key={`${idx}-${idx2.toString()}`} rule={rule} />
                      {isMounted && shouldShowAd && (
                        <AdCard ad={getRandomAd(idx, idx2)} />
                      )}
                    </>
                  )}
                </Fragment>
              );
            })}
          </div>
        </section>
      ))}

      {visibleItems < filteredSections.length && (
        <div className="flex justify-center mt-8">
          <button
            type="button"
            onClick={() =>
              setVisibleItems((prev) =>
                Math.min(prev + ITEMS_PER_PAGE, filteredSections.length),
              )
            }
            className="px-4 py-2 text-sm text-[#878787]"
          >
            Loading more...
          </button>
        </div>
      )}
    </>
  );
}
