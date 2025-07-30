'use client';

import { useState } from "react";
import BotCard from "./ui/bot-card";
import { ChevronLeft, ChevronRight } from "lucide-react";
import CategorySort from "./ui/categories-filters";
import { useModels } from "../hooks/useModels";

export default function BotGrid() {
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedCategory, setSelectedCategory] = useState("All Categories");
    const botsPerPage = 9;
    
    const { models, loading, error } = useModels();
    
    // Filter bots based on selected category
    const filteredBots = selectedCategory === "All Categories" 
        ? models 
        : models.filter(bot => bot.categoryId.name === selectedCategory);
    
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

    // Get unique categories for the filter
    const categories = ["All Categories", ...Array.from(new Set(models.map(bot => bot.categoryId.name)))];

    if (loading) {
        return (
            <div className="w-full max-w-5xl mx-auto px-4 py-8">
                <div className="flex justify-center items-center h-64">
                    <div className="text-lg">Loading bots...</div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="w-full max-w-5xl mx-auto px-4 py-8">
                <div className="flex justify-center items-center h-64">
                    <div className="text-lg text-red-500">Error: {error}</div>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-5xl mx-auto px-4 py-8">
            <div className="flex gap-4 justify-end mb-8">
                <CategorySort 
                    selectedCategory={selectedCategory}
                    onCategoryChange={handleCategoryChange}
                    categories={categories}
                />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {currentBots.map((bot) => (
                    <BotCard
                        key={bot._id}
                        id={bot._id}
                        name={bot.name}
                        description={bot.description}
                        category={bot.categoryId.name}
                    />
                ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
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
            )}
        </div>
    );
}