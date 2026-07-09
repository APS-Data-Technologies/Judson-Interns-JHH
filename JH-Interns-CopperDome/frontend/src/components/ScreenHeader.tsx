import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { IconArrowLeft, IconFork } from './icons';
import { useSession } from '../lib/session';

interface ScreenHeaderProps {
  title: string;
  showBack?: boolean;
  showTable?: boolean;
  rightSlot?: ReactNode;
}

export default function ScreenHeader({ title, showBack = false, showTable = true, rightSlot }: ScreenHeaderProps) {
  const navigate = useNavigate();
  const { session } = useSession();

  return (
    <header className="screen-header">
      <div className="screen-header__side">
        {showBack ? (
          <button type="button" className="icon-button" onClick={() => navigate(-1)} aria-label="Back">
            <IconArrowLeft />
          </button>
        ) : (
          <IconFork width={20} height={20} />
        )}
      </div>
      <h1 className="screen-header__title">{title}</h1>
      <div className="screen-header__side screen-header__side--end">
        {rightSlot ?? (showTable && session ? <span className="screen-header__table">Table {session.tableNumber}</span> : null)}
      </div>
    </header>
  );
}
