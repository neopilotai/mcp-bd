import type { MCP } from "@mcp-bd/data/mcp";
import { SearchInput } from "./search-input";
import { SearchList } from "./search-list";
import { SearchTitle } from "./search-title";

export function Search({ data }: { data?: MCP[] }) {
  return (
    <div className="w-full container mx-auto mb-16 px-4">
      <div className="max-w-[600px] mx-auto">
        <SearchTitle />
        <SearchInput placeholder="Search for MCP servers" />
      </div>

      <SearchList data={data ?? []} />
    </div>
  );
}
