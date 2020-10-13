import React, {useEffect, useState} from 'react';
import {BackHandler, KeyboardAvoidingView, Platform, SafeAreaView, StatusBar, View,} from 'react-native';
import WebView from 'react-native-webview';
import {normalize} from '../../common/common';
import {ActionIcon} from '../../components/ActionIcon';
import {ActionSheetEvent, simpleDialogEvent,} from '../../components/DialogManager/recievers';
import {TEMPLATE_EXIT_FULLSCREEN, TEMPLATE_NEW_NOTE,} from '../../components/DialogManager/templates';
import {useTracked} from '../../provider';
import {eSendEvent, eSubscribeEvent, eUnSubscribeEvent,} from '../../services/eventManager';
import {eClearEditor, eCloseFullscreenEditor, eOnLoadNote, eOpenFullscreenEditor,} from '../../services/events';
import {exitEditorAnimation} from '../../utils/animations';
import {DDS, editing, ToastEvent} from '../../utils/utils';
import {
    _onMessage,
    _onShouldStartLoadWithRequest,
    checkNote,
    clearEditor,
    EditorWebView,
    getNote,
    injectedJS,
    isNotedEdited,
    loadNote,
    onWebViewLoad,
    post,
    sourceUri,
} from './func';

let handleBack;
let tapCount = 0;


const Editor = ({noMenu}) => {
    // Global State
    const [state,] = useTracked();
    const {colors, premium} = state;
    const [fullscreen, setFullscreen] = useState(false);

    // FUNCTIONS

    useEffect(() => {
        let c = {...colors};
        c.factor = normalize(1);
        post('theme', colors);
    }, [colors.bg]);

    useEffect(() => {
        if (!DDS.isTab) return;
        if (noMenu) {
            post('nomenu', true);
        } else {
            post('nomenu', false);
        }
    }, [noMenu]);

    useEffect(() => {
        eSubscribeEvent(eOnLoadNote, load);
        eSubscribeEvent(eCloseFullscreenEditor, closeFullscreen);
        eSubscribeEvent(eClearEditor, onCallClear);
        return () => {
            eUnSubscribeEvent(eClearEditor, onCallClear);
            eUnSubscribeEvent(eCloseFullscreenEditor, closeFullscreen);
            eUnSubscribeEvent(eOnLoadNote, load);
        };
    }, []);

    useEffect(() => {
        if (!noMenu && DDS.isTab) {
            handleBack = BackHandler.addEventListener('hardwareBackPress', () => {
                simpleDialogEvent(TEMPLATE_EXIT_FULLSCREEN());
                editing.isFullscreen = false;
                return true;
            });
        }

        return () => {
            if (handleBack) {
                handleBack.remove();
                handleBack = null;
            }
        };
    }, [noMenu]);

    const load = async (item) => {
        await loadNote(item);
        if (!DDS.isTab) {
            handleBack = BackHandler.addEventListener(
                'hardwareBackPress',
                _onHardwareBackPress,
            );
        }
    };

    const onCallClear = async () => {
        if (editing.currentlyEditing) {
            exitEditorAnimation();
        }
        await clearEditor();
    };
    const closeFullscreen = () => {
        setFullscreen(false);
    };

    useEffect(() => {
        EditorWebView.current?.reload();
    }, [premium]);

    const _onHardwareBackPress = async () => {
        if (editing.currentlyEditing) {
            if (tapCount > 0) {
                await _onBackPress();
                return true;
            } else {
                tapCount = 1;
                setTimeout(() => {
                    tapCount = 0;
                }, 3000);
                ToastEvent.show('Press back again to exit editor', 'success');
                return true;
            }
        }
    };

    const _onBackPress = async () => {
        editing.currentlyEditing = true;
        if (DDS.isTab && !DDS.isSmallTab) {
            simpleDialogEvent(TEMPLATE_EXIT_FULLSCREEN());
        } else {

            exitEditorAnimation();
            if (checkNote() && isNotedEdited()) {
                ToastEvent.show('Note Saved!', 'success');
            }
            setTimeout(async () => {
                await clearEditor();
            }, 300);
            if (handleBack) {
                handleBack.remove();
                handleBack = null;
            }
        }
    };

    return (
        <SafeAreaView
            style={{
                flex: 1,
                backgroundColor:
                    DDS.isTab && !DDS.isSmallTab ? 'transparent' : colors.bg,
                height: '100%',
                width: '100%',
                flexDirection: 'row',
                justifyContent: 'space-between',
            }}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : null}
                style={{
                    height: '100%',
                    width: '100%',
                }}>
                {noMenu || DDS.isPhone || DDS.isSmallTab ? (
                    <View/>
                ) : (
                    <ActionIcon
                        name="arrow-left"
                        color={colors.heading}
                        onPress={_onBackPress}
                        iconStyle={{
                            textAlignVertical: 'center',
                        }}
                        customStyle={{
                            marginLeft: -5,
                            position: 'absolute',
                            marginTop:
                                Platform.OS === 'ios' ? 0 : StatusBar.currentHeight + 5,
                            zIndex: 11,
                            left: 0,
                            justifyContent: 'center',
                            alignItems: 'center',
                        }}
                    />
                )}

                <View
                    style={{
                        flexDirection: 'row',
                        width: DDS.isTab && !DDS.isSmallTab ? '30%' : '100%',
                        height: 50,
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        paddingHorizontal: 12,
                        position: DDS.isTab && !DDS.isSmallTab ? 'absolute' : 'relative',
                        backgroundColor: colors.bg,
                        right: 0,
                        marginTop: Platform.OS === 'ios' ? 0 : StatusBar.currentHeight,
                        zIndex: 10,
                    }}>
                    {DDS.isTab && !DDS.isSmallTab ? (
                        <View/>
                    ) : (
                        <ActionIcon
                            name="arrow-left"
                            color={colors.heading}
                            onPress={_onBackPress}
                            customStyle={{
                                marginLeft: -5,
                            }}
                        />
                    )}

                    <View
                        style={{
                            flexDirection: 'row',
                        }}>
                        <ActionIcon
                            name="plus"
                            color={colors.heading}
                            customStyle={{
                                marginLeft: 10,
                            }}
                            onPress={() => {
                                simpleDialogEvent(TEMPLATE_NEW_NOTE);
                            }}
                        />
                        {DDS.isTab && !DDS.isSmallTab && !fullscreen ? (
                            <ActionIcon
                                name="fullscreen"
                                color={colors.heading}
                                customStyle={{
                                    marginLeft: 10,
                                }}
                                onPress={() => {
                                    eSendEvent(eOpenFullscreenEditor);
                                    setFullscreen(true);
                                    editing.isFullscreen = true;
                                    post(
                                        JSON.stringify({
                                            type: 'nomenu',
                                            value: false,
                                        }),
                                    );
                                }}
                            />
                        ) : null}

                        <ActionIcon
                            name="undo-variant"
                            color={colors.heading}
                            customStyle={{
                                marginLeft: 10,
                            }}
                            onPress={() => {
                                post('undo');
                            }}
                        />
                        <ActionIcon
                            name="redo-variant"
                            color={colors.heading}
                            customStyle={{
                                marginLeft: 10,
                            }}
                            onPress={() => {
                                post('redo');
                            }}
                        />

                        <ActionIcon
                            name="dots-horizontal"
                            color={colors.heading}
                            customStyle={{
                                marginLeft: 10,
                            }}
                            onPress={() => {
                                ActionSheetEvent(
                                    getNote(),
                                    true,
                                    true,
                                    ['Add to', 'Share', 'Export', 'Delete'],
                                    ['Dark Mode', 'Add to Vault', 'Pin', 'Favorite'],
                                );
                            }}
                        />
                    </View>
                </View>

                <WebView
                    testID="editor"
                    ref={EditorWebView}
                    onError={(error) => console.log(error)}
                    onLoad={async () => await onWebViewLoad(noMenu, premium, colors)}
                    javaScriptEnabled={true}
                    injectedJavaScript={Platform.OS === 'ios' ? injectedJS : null}
                    onShouldStartLoadWithRequest={_onShouldStartLoadWithRequest}
                    renderLoading={() => (
                        <View
                            style={{
                                width: '100%',
                                height: '100%',
                                backgroundColor: 'transparent',
                            }}
                        />
                    )}
                    cacheMode="LOAD_DEFAULT"
                    cacheEnabled={false}
                    domStorageEnabled={true}
                    scrollEnabled={false}
                    bounces={false}
                    allowFileAccess={true}
                    scalesPageToFit={true}
                    allowingReadAccessToURL={Platform.OS === 'android' ? true : null}
                    allowFileAccessFromFileURLs={true}
                    allowUniversalAccessFromFileURLs={true}
                    originWhitelist={['*']}
                    source={
                        Platform.OS === 'ios'
                            ? {uri: sourceUri}
                            : {
                                uri: 'file:///android_asset/texteditor.html',
                                baseUrl: 'file:///android_asset/',
                            }
                    }
                    style={{
                        height: '100%',
                        maxHeight: '100%',
                        width: '100%',
                        backgroundColor: 'transparent',
                        marginTop:
                            DDS.isTab && !DDS.isSmallTab
                                ? Platform.OS === 'ios'
                                ? 0
                                : StatusBar.currentHeight
                                : 0,
                    }}
                    onMessage={_onMessage}
                />
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

export default Editor;
