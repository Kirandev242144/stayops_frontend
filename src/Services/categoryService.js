import BASE_URL from "../api/api";

export async function getCategories() {
    const response = await fetch(`${BASE_URL}/categories`);

    if (!response.ok) {
        throw new Error("Failed to fetch categories");
    }

    return await response.json();
}