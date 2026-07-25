"use client";

import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { Trash2 } from "lucide-react";
import { QuantitySelector } from "@/components/shared/QuantitySelector/QuantitySelector";
import { PriceDisplay } from "@/components/shared/PriceDisplay/PriceDisplay";
import { useCart } from "@/providers/CartProvider";
import type { CartItem as CartItemType } from "@/types/cart";

interface CartItemProps {
  item: CartItemType;
}

export function CartItem({ item }: CartItemProps) {
  const { updateQuantity, removeItem } = useCart();

  return (
    <div className="flex gap-4 border-b border-[color:var(--color-line)] py-5 first:pt-0">
      <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg border border-[color:var(--color-line)] bg-white">
        {item.imageUrl ? (
          <Image
            src={item.imageUrl}
            alt={item.name}
            fill
            sizes="96px"
            className="object-contain p-1"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[10px] text-[color:var(--color-text-tertiary)]">
            No Image
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1">
        <h3 className="text-[15px] font-semibold text-[color:var(--color-text)]">{item.name}</h3>
        {item.variantName && (
          <span className="text-xs text-[color:var(--color-text-tertiary)]">{item.variantName}</span>
        )}
        <div className="mt-auto flex items-center justify-between">
          <QuantitySelector
            quantity={item.quantity}
            maxQuantity={item.maxQuantity}
            onChange={(qty) => updateQuantity(item.productId, qty, item.variantId)}
          />
          <div className="flex items-center gap-3">
            <PriceDisplay price={item.price * item.quantity} size="sm" />
            <Button
              isIconOnly
              size="sm"
              variant="light"
              color="danger"
              onPress={() => removeItem(item.productId, item.variantId)}
              aria-label="Remove"
            >
              <Trash2 size={16} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
