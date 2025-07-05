import CategorySort from "./ui/categories-filters";
import OtherFilters from "./ui/other-filters";

export default function SortBar() {
    return (
        <div className="flex gap-4 justify-end mb-8">
            <CategorySort />
            <OtherFilters />
        </div>
    )
}