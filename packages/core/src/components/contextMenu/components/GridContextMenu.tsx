import { handlePasteEvent } from '@/components/contextMenu/utils';
import { useLocale } from '@/locale';
import { ContentSlot } from '@/renderer/ContentSlot';
import { ICalendarApp, ViewType } from '@/types';
import { clipboardStore } from '@/utils/clipboardStore';

import { ContextMenu, ContextMenuItem } from './Primitives';

interface GridContextMenuProps {
  x: number;
  y: number;
  date: Date;
  onClose: () => void;
  app: ICalendarApp;
  onCreateEvent: () => void;
  viewType?: ViewType;
}

const GridContextMenu = ({
  x,
  y,
  date,
  onClose,
  app,
  onCreateEvent,
  viewType,
}: GridContextMenuProps) => {
  const { t } = useLocale();
  if (!app.canMutateFromUI()) return null;

  const hasCopiedEvent = clipboardStore.hasEvent();

  const handlePaste = async () => {
    await handlePasteEvent(app, date, viewType);
    onClose();
  };

  const defaultContent = (
    <>
      <ContextMenuItem
        onClick={() => {
          onCreateEvent();
          onClose();
        }}
      >
        {t('newEvent') || 'New Event'}
      </ContextMenuItem>
      <ContextMenuItem onClick={handlePaste} disabled={!hasCopiedEvent}>
        {t('pasteHere') || 'Paste Here'}
      </ContextMenuItem>
    </>
  );

  return (
    <ContextMenu x={x} y={y} onClose={onClose} className='df-context-menu'>
      <ContentSlot
        generatorName='gridContextMenu'
        generatorArgs={{ date, viewType, onClose }}
        defaultContent={defaultContent}
      />
    </ContextMenu>
  );
};

export default GridContextMenu;
