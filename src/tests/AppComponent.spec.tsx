import React, { act } from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import App from '../App';
import RecordList from '../components/RecordList';
import { addRecord, fetchRecords, deleteRecord, updateRecord} from '../services/supabaseService';
import { ChakraProvider } from '@chakra-ui/react';
import { ReactNode } from 'react';
import { RecordModal } from '../components/RecordModal';
import { Record } from '../domain/record';

// fetchRecords をモック
jest.mock('../services/supabaseService');

// ChakraProvider でラップして Chakra UI コンポーネントをサポートする
const renderWithChakra = (ui: ReactNode) => render(<ChakraProvider>{ui}</ChakraProvider>);
const mockFetchRecords = fetchRecords as jest.MockedFunction<typeof fetchRecords>;

describe('タイトルが表示されるか', () => {
  it('コンポーネントが正しくレンダリングされることを確認する', () => {
    render(<App />);
    const linkElement = screen.getByText("Study Records"); // 適切なテキストを指定してください
    expect(linkElement).toBeInTheDocument();
  });
});

describe('ローディング状態が表示されるか', () => {
  it('ローディングスピナーが表示されることを確認する', async () => {
    // fetchRecords が解決しない状態をシミュレートしてローディング状態を維持
    mockFetchRecords.mockImplementation(() => new Promise(() => {}));

    await act(async () => {
      render(<RecordList />);
    });
    
    // ローディングメッセージが表示されることを確認
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });
});

describe('新規登録ボタンが表示されるか', () => {
  it('新規登録ボタンが動作することを確認する', async () => {
    // fetchRecords が解決する状態をシミュレート
    mockFetchRecords.mockResolvedValue([]);

    renderWithChakra(<RecordList />);

    // ボタンが表示されるまで待機する
    await waitFor(() => {
      const newRegistrationButton = screen.getByTestId('newRegister');
      expect(newRegistrationButton).toBeInTheDocument();
    });
  });
});

it('テーブルが正しく表示されるか', async () => {
  // モックデータを準備する
  const mockRecords = [
    { id: '1', title: 'Study React', time: 10 },
    { id: '2', title: 'Study TypeScript', time: 20 }
  ];
  
  // fetchRecords のモック実装を設定
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

describe('ボタンが正しく動作するか', () => {
  let mockOnSuccess: jest.Mock;
  let mockOnClose: jest.Mock;

  beforeEach(() => {
    mockOnSuccess = jest.fn();
    mockOnClose = jest.fn();
  });

  it('onSubmitHandler が正しく呼ばれ、成功時にアクションが実行されることを確認する', async () => {
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
    fireEvent.click(screen.getByTestId('Save'));

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

  it('エラーメッセージが表示されることを確認する', async () => {
    render(
      <RecordModal
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    // 空のデータで送信ボタンをクリック
    fireEvent.click(screen.getByTestId('Save'));

    // エラーメッセージが表示されることを確認
    await waitFor(() => {
      expect(screen.getByText(/内容の入力は必須です/i)).toBeInTheDocument();
      expect(screen.getByText(/時間の入力は必須です/i)).toBeInTheDocument();
    });
  });
});

describe('モーダルのタイトルが「新規登録」であるか', () => {
  it('モーダルのタイトルが「新規登録」であることを確認する', () => {
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
  it('学習時間にマイナスの数値を入力したときにエラーメッセージが表示されることを確認する', async () => {
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
    fireEvent.click(screen.getByTestId('Save'));

    // エラーメッセージが表示されるのを待つ
    await waitFor(() => {
      expect(screen.getByText(/時間は0以上である必要があります/i)).toBeInTheDocument();
    });
  });
});

describe('RecordList コンポーネント', () => {
  beforeEach(() => {
    // 初期状態としてレコードのモックデータを設定
    (fetchRecords as jest.Mock).mockResolvedValue([
      { id: '1', title: 'Test Title 1', time: 30 },
      { id: '2', title: 'Test Title 2', time: 45 },
    ]);
    (deleteRecord as jest.Mock).mockResolvedValue({});
  });

  it('削除ボタンが動作し、リストからアイテムが削除されることを確認する', async () => {
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

  it('削除処理でエラーが発生する場合の動作を確認する', async () => {
    // deleteRecord のモックをエラーを返すように設定
    (deleteRecord as jest.Mock).mockRejectedValue(new Error('削除に失敗しました'));

    render(<RecordList />);

    // ローディングが終了するまで待つ
    await waitFor(() => screen.getByText('Test Title 1'));

    // 削除ボタンをクリック
    const deleteButtons = screen.getAllByTestId('Delete');
    fireEvent.click(deleteButtons[0]);

    // エラーメッセージが表示されるのを待つ
    await waitFor(() => {
      expect(screen.getByText('削除に失敗しました')).toBeInTheDocument();
    });
  });
});

describe('モーダルのタイトルが「記録編集」であるか', () => {
  it('should display the modal title as "記録編集" when editing', () => {
    const mockRecord = new Record('1', 'Existing Title', 60); // 編集対象のレコードを渡す

    render(
      <RecordModal
        isOpen={true}
        onClose={() => {}}
        onSuccess={() => {}}
        record={mockRecord} // 編集対象のレコードを渡す
      />
    );

    // モーダルのタイトルが「記録編集」であることを確認
    expect(screen.getByText('記録編集')).toBeInTheDocument();
  });
});

describe('レコードの編集と更新', () => {
  let mockOnSuccess: jest.Mock;
  let mockOnClose: jest.Mock;

  beforeEach(() => {
    mockOnSuccess = jest.fn();
    mockOnClose = jest.fn();
  });

  it('should update the record when editing and saving', async () => {
    const mockRecord = new Record('1', 'Existing Title', 60); // 編集対象のレコードを渡す
    (updateRecord as jest.Mock).mockResolvedValueOnce(undefined);

    render(
      <RecordModal
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        record={mockRecord} // 編集対象のレコードを渡す
      />
    );

    // フォームの値を変更
    fireEvent.change(screen.getByLabelText(/学習記録/i), {
      target: { value: 'Updated Title' }
    });
    fireEvent.change(screen.getByLabelText(/学習時間 \(分\)/i), {
      target: { value: '90' }
    });

    // 保存ボタンをクリック
    fireEvent.click(screen.getByTestId('Save'));

    // updateRecord が正しいデータで呼ばれることを確認
    await waitFor(() => {
      expect(updateRecord).toHaveBeenCalledWith(mockRecord.id, {
        title: 'Updated Title',
        time: '90'
      });
      expect(mockOnSuccess).toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();
    });
  });
});
