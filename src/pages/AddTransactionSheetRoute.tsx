import { useNavigate } from 'react-router-dom';
import BottomSheet from '../components/BottomSheet';
import QuickAddExpense from './QuickAddExpense';

export default function AddTransactionSheetRoute() {
  const navigate = useNavigate();

  const close = () => {
    // If the user came from somewhere else, go back; otherwise go home.
    if (window.history.length > 1) navigate(-1);
    else navigate('/');
  };

  return (
    <BottomSheet open title="Add Transaction" onClose={close}>
      <div className="px-4 pb-4">
        <QuickAddExpense embedded onDone={close} />
      </div>
    </BottomSheet>
  );
}

