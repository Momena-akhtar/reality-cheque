'use client';

import { useState } from "react";
import BotCard from "./ui/bot-card";
import { bots } from "./utils/bots";
import { ChevronLeft, ChevronRight } from "lucide-react";
import CategorySort from "./ui/categories-filters";
import OtherFilters from "./ui/other-filters";

export default function BotGrid() {
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedCategory, setSelectedCategory] = useState("All Categories");
    const botsPerPage = 9;
    
    // Filter bots based on selected category
    const filteredBots = selectedCategory === "All Categories" 
        ? bots 
        : bots.filter(bot => bot.category === selectedCategory);
    
    const totalPages = Math.ceil(filteredBots.length / botsPerPage);
    
    const indexOfLastBot = currentPage * botsPerPage;
    const indexOfFirstBot = indexOfLastBot - botsPerPage;
    const currentBots = filteredBots.slice(indexOfFirstBot, indexOfLastBot);

    const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

    // Reset to first page when category changes
    const handleCategoryChange = (category: string) => {
        setSelectedCategory(category);
        setCurrentPage(1);
    };

    return (
        <div className="w-full max-w-5xl mx-auto px-4 py-8">
            <div className="flex gap-4 justify-end mb-8">
                <CategorySort 
                    selectedCategory={selectedCategory}
                    onCategoryChange={handleCategoryChange}
                />
                <OtherFilters />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {currentBots.map((bot, index) => (
                    <BotCard
                        key={index}
                        name={bot.title}
                        description={bot.description}
                        logo={bot.logo}
                        category={bot.category}
                        version={bot.version as "Free" | "Paid"}
                    />
                ))}
            </div>

            {/* Pagination */}
            <div className="flex justify-center items-center mt-8 gap-2">
                <button
                    onClick={() => paginate(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-4 py-2 text-sm  text-foreground disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                    <div className="flex items-center gap-2">
                        <ChevronLeft size={16} /> Previous
                    </div>
                </button>
                <div className="flex gap-2">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((number) => (
                        <button
                            key={number}
                            onClick={() => paginate(number)}
                            className={`px-4 py-2 text-sm rounded-full cursor-pointer transition-colors ${
                                currentPage === number
                                    ? "bg-card-hover text-foreground hover:bg-card-hover"
                                    : "bg-background text-foreground"
                            }`}
                        >
                            {number}
                        </button>
                    ))}
                </div>
                <button
                    onClick={() => paginate(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 text-sm text-foreground disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                    <div className="flex items-center gap-2">
                        Next <ChevronRight size={16} />
                    </div>
                </button>
            </div>
        </div>
    );
}