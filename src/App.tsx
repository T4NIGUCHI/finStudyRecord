import React from 'react';
import { ChakraProvider, Box, Heading } from '@chakra-ui/react';
import RecordList from './components/RecordList';

const App: React.FC = () => {
  return (
    <ChakraProvider>
      <Box p={5}>
        <Heading mb={6}>Study Records</Heading>
        <RecordList />
      </Box>
    </ChakraProvider>
  );
};

export default App;
