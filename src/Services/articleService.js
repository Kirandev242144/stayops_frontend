import BASE_URL from "../api/api";

export async function getArticles() {
    const response = await fetch(`${BASE_URL}/articles`);

    if (!response.ok) {
        throw new Error("Failed to fetch articles");
    }

    return await response.json();
}