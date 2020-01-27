import React, {useEffect, useState} from 'react';
import {db} from '../../../App';
import Container from '../../components/Container';
import {NotesList} from '../../components/NotesList';
import {useTracked} from '../../provider';

export const Notes = ({navigation}) => {
  const [state, dispatch] = useTracked();

  const [notes, setNotes] = useState([]);

  let params = navigation.state ? navigation.state.params : null;

  useEffect(() => {
    if (!params) {
      params = {
        heading: 'Notes',
      };
    }
  }, []);

  useEffect(() => {
    let allNotes = db.getTopic(params.notebookID, params.title);
    if (allNotes && allNotes.length > 0) {
      setNotes(allNotes);
    }
  }, []);

  return (
    <Container
      bottomButtonText="Create a new note"
      canGoBack={false}
      heading={params.title}
      canGoBack={true}
      data={notes}
      placeholder={`Search in ${params.title}`}
      bottomButtonOnPress={() => {}}>
      <NotesList isSearch={false} notes={notes} keyword={null} />
    </Container>
  );
};

Notes.navigationOptions = {
  header: null,
};

export default Notes;
