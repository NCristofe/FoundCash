import { Dialog } from './Dialog';
import { QuickEntryForm } from './QuickEntryForm';

interface QuickEntryDialogProps {
  open: boolean;
  onClose: () => void;
}

export function QuickEntryDialog({ open, onClose }: QuickEntryDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} title="Nova oportunidade">
      <QuickEntryForm
        allowAnother
        idPrefix="qe-dialog"
        onSaved={(_opportunity, keepOpen) => {
          if (!keepOpen) onClose();
        }}
      />
    </Dialog>
  );
}
