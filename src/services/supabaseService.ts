import { supabase } from '../utils/supabase';
import { Record } from '../domain/record';

export const fetchRecords = async (): Promise<Record[]> => {
  const { data, error } = await supabase
    .from('study-record') // 型パラメータを省略
    .select('*');

  if (error) {
    console.error('Error fetching records:', error.message);
    throw new Error(error.message);
  }

  // time を string から number に変換して、Recordインスタンスを生成
  return (data as { id: string; title: string; time: string }[]).map(record => new Record(record.id, record.title, parseFloat(record.time)));
};

export const addRecord = async (recordFormValues: { title: string; time: string }) => {
  const newId = crypto.randomUUID(); // UUID生成
  const record = new Record(newId, recordFormValues.title, parseFloat(recordFormValues.time)); // time を number に変換

  const { data, error } = await supabase
    .from('study-record')
    .insert([record]);

  if (error) throw error;
  return data;
};

export const deleteRecord = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('study-record')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

export const updateRecord = async (id: string, recordFormValues: { title: string; time: string }) => {
  const updatedRecord = {
    title: recordFormValues.title,
    time: parseFloat(recordFormValues.time) // time を number に変換
  };

  const { data, error } = await supabase
    .from('study-record')
    .update(updatedRecord)
    .eq('id', id);

  if (error) throw error;
  return data;
};
