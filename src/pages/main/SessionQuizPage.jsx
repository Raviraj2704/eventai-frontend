 import { useParams } from 'react-router-dom';
import AIQuizGenerator from '../../components/ai/AIQuizGenerator';

export default function SessionQuizPage() {
  const { id } = useParams();
  return <AIQuizGenerator sessionId={id} sessionTitle="Session Quiz" />;
}