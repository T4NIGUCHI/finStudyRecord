import React,{ act } from 'react';
import {render, screen ,waitFor,fireEvent} from '@testing-library/react';
import App from '../App';
import RecordList from '../components/RecordList';
import { addRecord, fetchRecords,deleteRecord } from '../services/supabaseService';
import { ChakraProvider } from '@chakra-ui/react';
import { ReactNode } from 'react';
import {RecordModal} from '../components/RecordModal';

// fetchRecords をモック
jest.mock('../services/supabaseService');
// ChakraProvider でラップして Chakra UI コンポーネントをサポートする
const renderWithChakra = (ui: ReactNode) => render(<ChakraProvider>{ui}</ChakraProvider>);
const mockFetchRecords = fetchRecords as jest.MockedFunction<typeof fetchRecords>;

describe('タイトルがあるか', () => {
  it('should render the component', () => {
    render(<App />);
    const linkElement = screen.getByText("Study Records"); // 適切なテキストを指定してください
    expect(linkElement).toBeInTheDocument();
  });
});

describe('ローディングされているか', () => {
  it('should display loading spinner', async () => {
    // fetchRecordsが解決しない状態をシミュレートしてローディング状態を維持
    mockFetchRecords.mockImplementation(() => new Promise(() => {}));

    await act(async () => {
      render(<RecordList />);
    });
    
    // ローディングメッセージが表示されることを確認
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });
});

describe('新規登録ボタンがあるか', () => {
  it('should work new registration button', async () => {
    // fetchRecordsが解決する状態をシミュレート
    mockFetchRecords.mockResolvedValue([]);

    renderWithChakra(<RecordList />);

    // ボタンが表示されるまで待機する
    await waitFor(() => {
      const newRegistrationButton = screen.getByTestId('newRegister');
      expect(newRegistrationButton).toBeInTheDocument();
    });
  });
});

it('テーブルを見ることができるか', async () => {
  // モックデータを準備する
  const mockRecords = [
    { id: '1', title: 'Study React', time: 10 },
    { id: '2', title: 'Study TypeScript', time: 20 }
  ];
  
  // fetchRecordsのモック実装を設定
  mockFetchRecords.mockResolvedValue(mockRecords);

  renderWithChakra(<RecordList />);

  await waitFor(() => {
    // テーブルが表示されていることを確認
    expect(screen.getByText('ID')).toBeInTheDocument();
    expect(screen.getByText('Title')).toBeInTheDocument();
    expect(screen.getByText('Time')).toBeInTheDocument();

    // モックデータがテーブルに表示されていることを確認
    expect(screen.getByText('Study React')).toBeInTheDocument();
    expect(screen.getByText(10)).toBeInTheDocument();
    expect(screen.getByText('Study TypeScript')).toBeInTheDocument();
    expect(screen.getByText(20)).toBeInTheDocument();
  });
});

describe('ボタンが動作するか', () => {
  let mockOnSuccess: jest.Mock;
  let mockOnClose: jest.Mock;

  beforeEach(() => {
    mockOnSuccess = jest.fn();
    mockOnClose = jest.fn();
  });

  it('should call onSubmitHandler correctly and perform actions on success', async () => {
    // モックを設定
    (addRecord as jest.Mock).mockResolvedValueOnce(undefined);

    render(
      <RecordModal
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    // フォームにデータを入力
    fireEvent.change(screen.getByLabelText(/学習記録/i), {
      target: { value: 'Test Title' }
    });
    fireEvent.change(screen.getByLabelText(/学習時間 \(分\)/i), {
      target: { value: '30'}
    });

    // 登録ボタンをクリック
    fireEvent.click(screen.getByTestId('Regist'));

    // onSubmitHandler が正しいデータで呼ばれることを確認
    await waitFor(() => {
      expect(addRecord).toHaveBeenCalledWith({
        title: 'Test Title',
        time: '30'
      });
      expect(mockOnSuccess).toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('エラー表示ができるか', async () => {
    render(
      <RecordModal
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    // 空のデータで送信ボタンをクリック
    fireEvent.click(screen.getByTestId('Regist'));

    // エラーメッセージが表示されることを確認
    await waitFor(() => {
      expect(screen.getByText(/内容の入力は必須です/i)).toBeInTheDocument();
      expect(screen.getByText(/時間の入力は必須です/i)).toBeInTheDocument();
    });
  });
});

describe('モーダルのタイトルが「新規登録」であるか', () => {
  it('should display the correct title in the modal', () => {
    render(
      <RecordModal
        isOpen={true}
        onClose={() => {}}
        onSuccess={() => {}}
      />
    );

    // モーダルのタイトルが「新規登録」であることを確認
    expect(screen.getByText(/新規登録/i)).toBeInTheDocument();
  });
});

describe('マイナス数値の入力でエラーが出るか', () => {
  it('should show error message when a negative number is entered for time', async () => {
    render(
      <RecordModal
        isOpen={true}
        onClose={() => {}}
        onSuccess={() => {}}
      />
    );

    // 学習記録を入力
    fireEvent.change(screen.getByLabelText(/学習記録/i), {
      target: { value: 'Test Title' }
    });

    // 学習時間にマイナスの数値を入力
    fireEvent.change(screen.getByLabelText(/学習時間 \(分\)/i), {
      target: { value: '-10' }
    });

    // フォームを送信
    fireEvent.click(screen.getByTestId('Regist'));

    // エラーメッセージが表示されるのを待つ
    await waitFor(() => {
      expect(screen.getByText(/時間は0以上である必要があります/i)).toBeInTheDocument();
    });
  });
});

describe('RecordList', () => {
  beforeEach(() => {
    // 初期状態としてレコードのモックデータを設定
    (fetchRecords as jest.Mock).mockResolvedValue([
      { id: '1', title: 'Test Title 1', time: 30 },
      { id: '2', title: 'Test Title 2', time: 45 },
    ]);
    (deleteRecord as jest.Mock).mockResolvedValue({});
  });

  it('should call deleteRecord and remove the item from the list', async () => {
    render(<RecordList />);

    // ローディングが終了するまで待つ
    await waitFor(() => screen.getByText('Test Title 1'));

    // 削除ボタンをクリック
    const deleteButtons = screen.getAllByTestId('Delete');
    fireEvent.click(deleteButtons[0]);

    // 削除アクションが呼ばれるのを待つ
    await waitFor(() => {
      expect(deleteRecord).toHaveBeenCalledWith('1');
    });

    // レコードが削除されたかを確認
    await waitFor(() => {
      expect(screen.queryByText('Test Title 1')).toBeNull();
    });
  });

  it('should handle deletion error correctly', async () => {
    // deleteRecord のモックをエラーを返すように設定
    (deleteRecord as jest.Mock).mockRejectedValue(new Error('Deletion failed'));

    render(<RecordList />);

    // ローディングが終了するまで待つ
    await waitFor(() => screen.getByText('Test Title 1'));

    // 削除ボタンをクリック
    const deleteButtons = screen.getAllByTestId('Delete');
    fireEvent.click(deleteButtons[0]);

    // エラーメッセージが表示されるか確認
    await waitFor(() => {
      expect(screen.getByText('Deletion failed')).toBeInTheDocument();
    });
  });
});