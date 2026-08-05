import { create } from "zustand";
import { persist } from "zustand/middleware";

const useCartStore = create(
  persist(
    (set, get) => ({
      items: [], // [{ materialId, title, price, unit, stock, quantity, image, distributorName }]

      addItem: (material, quantity = 1) => {
        const items = get().items;
        const existing = items.find((i) => i.materialId === material.id);

        if (existing) {
          set({
            items: items.map((i) =>
              i.materialId === material.id
                ? { ...i, quantity: Math.min(i.quantity + quantity, material.quantity) }
                : i
            ),
          });
        } else {
          set({
            items: [
              ...items,
              {
                materialId: material.id,
                title: material.title,
                price: material.price,
                unit: material.unit,
                stock: material.quantity,
                quantity: Math.min(quantity, material.quantity),
                image: material.image || null,
                distributorName: material.distributorName || "",
                category: material.category || "",
              },
            ],
          });
        }
      },

      updateQuantity: (materialId, quantity) => {
        const items = get().items;
        const item = items.find((i) => i.materialId === materialId);
        if (!item) return;

        if (quantity <= 0) {
          set({ items: items.filter((i) => i.materialId !== materialId) });
        } else {
          set({
            items: items.map((i) =>
              i.materialId === materialId
                ? { ...i, quantity: Math.min(quantity, i.stock) }
                : i
            ),
          });
        }
      },

      removeItem: (materialId) => {
        set({ items: get().items.filter((i) => i.materialId !== materialId) });
      },

      clearCart: () => set({ items: [] }),

      getTotal: () => {
        return get().items.reduce((sum, item) => sum + item.price * item.quantity, 0);
      },

      getTotalItems: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0);
      },
    }),
    {
      name: "remat-cart",
    }
  )
);

export default useCartStore;
