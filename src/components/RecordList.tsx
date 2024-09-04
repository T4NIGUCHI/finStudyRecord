import React, { useEffect, useState } from 'react';
import { Box, Table, Thead, Tbody, Tr, Th, Td, TableContainer, Text, Spinner, Button } from '@chakra-ui/react';
import { fetchRecords, deleteRecord } from '../services/supabaseService';
import { Record } from '../domain/record';
import RecordModal from './RecordModal';

const RecordList: React.FC = () => {
  const [records, setRecords] = useState<Record[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedRecord, setSelectedRecord] = useState<Record | null>(null);

  useEffect(() => {
    const loadRecords = async () => {
      try {
        const fetchedRecords = await fetchRecords();
        setRecords(fetchedRecords);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    loadRecords();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      await deleteRecord(id);
      setRecords(records.filter(record => record.id !== id));
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleModalOpen = (record: Record | null = null) => {
    setSelectedRecord(record);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedRecord(null);
  };

  const handleModalSuccess = () => {
    // モーダルからの成功コールバック
    fetchRecords().then(setRecords);
  };

  if (loading) {
    return (
      <Box display="flex" alignItems="center" justifyContent="center" height="100vh">
        <Spinner size="xl" />
      </Box>
    );
  }

  if (error) {
    return <Text color="red.500">{error}</Text>;
  }

  return (
    <Box>
      <Button onClick={() => handleModalOpen()} mb={4} data-testid="newRegister">
        新規登録
      </Button>
      <TableContainer>
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>ID</Th>
              <Th>Title</Th>
              <Th>Time</Th>
              <Th>Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {records.map(record => (
              <Tr key={record.id}>
                <Td>{record.id}</Td>
                <Td>{record.title}</Td>
                <Td>{record.time}</Td>
                <Td>
                  <Button colorScheme="blue" onClick={() => handleModalOpen(record)} data-testid="Edit">
                    編集
                  </Button>
                  <Button colorScheme="red" onClick={() => handleDelete(record.id)} data-testid="Delete" ml={2}>
                    削除
                  </Button>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </TableContainer>
      <RecordModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSuccess={handleModalSuccess}
        record={selectedRecord}  // 編集する記録をモーダルに渡す
      />
    </Box>
  );
};

export default RecordList;
