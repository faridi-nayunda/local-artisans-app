import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import API from "../../../utils/api";

const Category = () => {
    const { id } = useParams();
    const [category, setCategory] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        API.get(`http://127.0.0.1:8000/api/categories/${id}`)
            .then(response => {
                console.log(response.data);
                setCategory(response.data); // Axios parses JSON automatically
                setLoading(false);
            })
            .catch(error => {
                setError(error.response?.data?.message || "Error fetching category");
                setLoading(false);
            });
    }, [id]);

    if (loading) return <div>Loading...</div>;
    if (error) return <div className="text-red-600">Error: {error}</div>;

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">{category.name}</h1>
            {category.products?.length > 0 ? (
                <ul className="space-y-2">
                    {category.products.map(product => (
                        <li key={product.id} className="border p-2 rounded-md shadow">
                            {product.name}
                        </li>
                    ))}
                </ul>
            ) : (
                <p>No products found in this category.</p>
            )}
        </div>
    );
};

export default Category;
