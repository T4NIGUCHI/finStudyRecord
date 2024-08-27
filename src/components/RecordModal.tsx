import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import {
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody,
  ModalFooter, Button, FormControl, FormLabel, Input, FormErrorMessage
} from '@chakra-ui/react';
import { RecordFormValues } from '../domain/record';
import { addRecord } from '../services/supabaseService';

interface RecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const RecordModal: React.FC<RecordModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { handleSubmit, control, reset, formState: { errors } } = useForm<RecordFormValues>({
    defaultValues: {
      title: '',
      time: ''
    }
  });

  const onSubmitHandler = async (data: RecordFormValues) => {
    try {
      // time を string から number に変換
      await addRecord({
        title: data.title,
        time: data.time
      });
      onSuccess(); // 成功コールバック
      reset(); // フォームをリセット
      onClose(); // モーダルを閉じる
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader >新規登録</ModalHeader>
        <ModalBody>
          <form onSubmit={handleSubmit(onSubmitHandler)}>
            <FormControl isInvalid={!!errors.title}>
              <FormLabel htmlFor="title_input">学習記録</FormLabel>
              <Controller
                name="title"
                control={control}
                rules={{ required: "内容の入力は必須です" }}
                render={({ field }) => <Input id="title_input" {...field} />}
              />
              <FormErrorMessage>{errors.title?.message}</FormErrorMessage>
            </FormControl>
            <FormControl mt={4} isInvalid={!!errors.time}>
              <FormLabel htmlFor="time_input">学習時間 (分)</FormLabel>
              <Controller
                name="time"
                control={control}
                rules={{
                  required: "時間の入力は必須です",
                  min: { value: 1, message: "時間は0以上である必要があります" }
                }}
                render={({ field }) => <Input id="time_input" type="number" {...field} />}
              />
              <FormErrorMessage>{errors.time?.message}</FormErrorMessage>
            </FormControl>
            <ModalFooter>
              <Button colorScheme="blue" mr={3} type="submit" data-testid="Regist">
                登録
              </Button>
              <Button variant="outline" onClick={onClose}>
                キャンセル
              </Button>
            </ModalFooter>
          </form>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default RecordModal;
