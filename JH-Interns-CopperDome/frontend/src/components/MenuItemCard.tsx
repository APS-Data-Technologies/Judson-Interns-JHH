import type { MenuItem } from '../lib/types';
import { dietaryLabel, formatPrice } from '../lib/dietary';
import { IconFork, IconPlus } from './icons';

interface MenuItemCardProps {
  item: MenuItem;
  kitchenName: string;
  onOpen: () => void;
  onQuickAdd: () => void;
}

export default function MenuItemCard({ item, kitchenName, onOpen, onQuickAdd }: MenuItemCardProps) {
  return (
    <div className="card menu-item-card" role="button" tabIndex={0} onClick={onOpen}>
      <div className="image-placeholder menu-item-card__image">
        <IconFork />
      </div>
      <div className="menu-item-card__body">
        <span className="chip" style={{ alignSelf: 'flex-start' }}>
          {kitchenName}
        </span>
        <div className="menu-item-card__top">
          <span className="menu-item-card__name">{item.name}</span>
        </div>
        <p className="menu-item-card__desc">{item.description}</p>
        <div className="menu-item-card__footer">
          <div className="chip-row">
            {item.dietary_tags.map((tag) => (
              <span key={tag} className="chip chip--tag" title={dietaryLabel(tag)}>
                {tag}
              </span>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span className="menu-item-card__price">{formatPrice(item.price)}</span>
            <button
              type="button"
              className="add-button"
              aria-label={`Add ${item.name} to cart`}
              onClick={(event) => {
                event.stopPropagation();
                onQuickAdd();
              }}
            >
              <IconPlus width={16} height={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
