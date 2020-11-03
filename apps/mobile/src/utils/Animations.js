import Animated, {Easing} from 'react-native-reanimated';
import {Dimensions} from 'react-native';
import {editing} from './index';

const {Value, timing} = Animated;

export const EditorPosition = new Value(0);
export const EditorScale = new Value(1);
export const EditorOpacity = new Value(0);
export const EditorTranslateY = new Value(
    Dimensions.get('window').height * 2
);

export function openEditorAnimation() {
    EditorTranslateY.setValue(Dimensions.get('window').height * 0.75);
    EditorOpacity.setValue(0);

    editing.currentlyEditing = true;


    timing(EditorTranslateY, {
        duration: 200,
        toValue: 0,
        easing: Easing.out(Easing.ease),
    }).start();
    timing(EditorOpacity, {
        duration: 150,
        toValue: 1,
        easing: Easing.out(Easing.ease),
    }).start();
}

export function exitEditorAnimation() {
    EditorOpacity.setValue(1);
    EditorTranslateY.setValue(0);
    editing.currentlyEditing = false;

    timing(EditorOpacity, {
        duration: 150,
        toValue: 0,
        easing: Easing.inOut(Easing.ease),
    }).start();
    timing(EditorTranslateY, {
        duration: 200,
        toValue: Dimensions.get('window').height * 2,
        easing: Easing.inOut(Easing.ease),
    }).start();
}
