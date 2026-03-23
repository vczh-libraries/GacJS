export interface SnapshotFolder {
    type: 'Folder';
    content: { [key: string]: SnapshotEntry };
}

export type SnapshotEntry = SnapshotFolder | 'File';

export const Snapshot: SnapshotEntry = {
    "type": "Folder",
    "content": {
        "Application": {
            "type": "Folder",
            "content": {
                "ControlTemplate": {
                    "type": "Folder",
                    "content": {
                        "frame_0.json": "File",
                        "frame_1.json": "File",
                        "frame_2.json": "File"
                    }
                },
                "ControlTemplate.json": "File",
                "ControlThemeName": {
                    "type": "Folder",
                    "content": {
                        "frame_0.json": "File",
                        "frame_1.json": "File",
                        "frame_2.json": "File"
                    }
                },
                "ControlThemeName.json": "File",
                "Dialog_Color": {
                    "type": "Folder",
                    "content": {
                        "OpenAndClose": {
                            "type": "Folder",
                            "content": {
                                "frame_0.json": "File",
                                "frame_1.json": "File",
                                "frame_2.json": "File",
                                "frame_3.json": "File"
                            }
                        },
                        "OpenAndClose.json": "File"
                    }
                },
                "Dialog_File": {
                    "type": "Folder",
                    "content": {
                        "Listing_Root_Filter": {
                            "type": "Folder",
                            "content": {
                                "frame_0.json": "File",
                                "frame_1.json": "File",
                                "frame_2.json": "File",
                                "frame_3.json": "File"
                            }
                        },
                        "Listing_Root_Filter.json": "File",
                        "MessageBoxes_FileExpected_Error_StaysOpen": {
                            "type": "Folder",
                            "content": {
                                "frame_0.json": "File",
                                "frame_1.json": "File",
                                "frame_2.json": "File",
                                "frame_3.json": "File",
                                "frame_4.json": "File",
                                "frame_5.json": "File"
                            }
                        },
                        "MessageBoxes_FileExpected_Error_StaysOpen.json": "File",
                        "MessageBoxes_FileMustExist_Error_StaysOpen": {
                            "type": "Folder",
                            "content": {
                                "frame_0.json": "File",
                                "frame_1.json": "File",
                                "frame_2.json": "File",
                                "frame_3.json": "File",
                                "frame_4.json": "File",
                                "frame_5.json": "File"
                            }
                        },
                        "MessageBoxes_FileMustExist_Error_StaysOpen.json": "File",
                        "MessageBoxes_MultipleSelectionNotEnabled_Error_StaysOpen": {
                            "type": "Folder",
                            "content": {
                                "frame_0.json": "File",
                                "frame_1.json": "File",
                                "frame_2.json": "File",
                                "frame_3.json": "File",
                                "frame_4.json": "File",
                                "frame_5.json": "File"
                            }
                        },
                        "MessageBoxes_MultipleSelectionNotEnabled_Error_StaysOpen.json": "File",
                        "MessageBoxes_PromptCreateFile_Open_CancelThenOK": {
                            "type": "Folder",
                            "content": {
                                "frame_0.json": "File",
                                "frame_1.json": "File",
                                "frame_2.json": "File",
                                "frame_3.json": "File",
                                "frame_4.json": "File",
                                "frame_5.json": "File",
                                "frame_6.json": "File"
                            }
                        },
                        "MessageBoxes_PromptCreateFile_Open_CancelThenOK.json": "File",
                        "MessageBoxes_PromptOverwriteFile_Save_CancelThenOK": {
                            "type": "Folder",
                            "content": {
                                "frame_0.json": "File",
                                "frame_1.json": "File",
                                "frame_2.json": "File",
                                "frame_3.json": "File",
                                "frame_4.json": "File",
                                "frame_5.json": "File",
                                "frame_6.json": "File"
                            }
                        },
                        "MessageBoxes_PromptOverwriteFile_Save_CancelThenOK.json": "File",
                        "MultipleSelection_Root_AllFiles": {
                            "type": "Folder",
                            "content": {
                                "frame_0.json": "File",
                                "frame_1.json": "File",
                                "frame_2.json": "File",
                                "frame_3.json": "File",
                                "frame_4.json": "File"
                            }
                        },
                        "MultipleSelection_Root_AllFiles.json": "File",
                        "MultipleSelection_Root_TextFiles": {
                            "type": "Folder",
                            "content": {
                                "frame_0.json": "File",
                                "frame_1.json": "File",
                                "frame_2.json": "File",
                                "frame_3.json": "File",
                                "frame_4.json": "File",
                                "frame_5.json": "File"
                            }
                        },
                        "MultipleSelection_Root_TextFiles.json": "File",
                        "Navigation_Listing_Root_A_AA": {
                            "type": "Folder",
                            "content": {
                                "frame_0.json": "File",
                                "frame_1.json": "File",
                                "frame_2.json": "File",
                                "frame_3.json": "File",
                                "frame_4.json": "File",
                                "frame_5.json": "File",
                                "frame_6.json": "File"
                            }
                        },
                        "Navigation_Listing_Root_A_AA.json": "File",
                        "OpenAndClose": {
                            "type": "Folder",
                            "content": {
                                "frame_0.json": "File",
                                "frame_1.json": "File",
                                "frame_2.json": "File",
                                "frame_3.json": "File",
                                "frame_4.json": "File"
                            }
                        },
                        "OpenAndClose.json": "File",
                        "OpenAndSelect": {
                            "type": "Folder",
                            "content": {
                                "frame_0.json": "File",
                                "frame_1.json": "File",
                                "frame_2.json": "File",
                                "frame_3.json": "File",
                                "frame_4.json": "File"
                            }
                        },
                        "OpenAndSelect.json": "File",
                        "SavePromptCreateFile_OpenAndClose": {
                            "type": "Folder",
                            "content": {
                                "frame_0.json": "File",
                                "frame_1.json": "File",
                                "frame_2.json": "File",
                                "frame_3.json": "File"
                            }
                        },
                        "SavePromptCreateFile_OpenAndClose.json": "File",
                        "SavePromptOverwriteFile_OpenAndClose": {
                            "type": "Folder",
                            "content": {
                                "frame_0.json": "File",
                                "frame_1.json": "File",
                                "frame_2.json": "File",
                                "frame_3.json": "File",
                                "frame_4.json": "File"
                            }
                        },
                        "SavePromptOverwriteFile_OpenAndClose.json": "File",
                        "ScrollResetOnNavigation": {
                            "type": "Folder",
                            "content": {
                                "frame_0.json": "File",
                                "frame_1.json": "File",
                                "frame_2.json": "File",
                                "frame_3.json": "File",
                                "frame_4.json": "File",
                                "frame_5.json": "File"
                            }
                        },
                        "ScrollResetOnNavigation.json": "File",
                        "SingleSelection_CtrlClickBehavesLikeClick": {
                            "type": "Folder",
                            "content": {
                                "frame_0.json": "File",
                                "frame_1.json": "File",
                                "frame_2.json": "File",
                                "frame_3.json": "File",
                                "frame_4.json": "File"
                            }
                        },
                        "SingleSelection_CtrlClickBehavesLikeClick.json": "File",
                        "TypedSelection_AllFiles_NoExt_FailThenPass": {
                            "type": "Folder",
                            "content": {
                                "frame_0.json": "File",
                                "frame_1.json": "File",
                                "frame_2.json": "File",
                                "frame_3.json": "File",
                                "frame_4.json": "File",
                                "frame_5.json": "File"
                            }
                        },
                        "TypedSelection_AllFiles_NoExt_FailThenPass.json": "File",
                        "TypedSelection_TextFiles_NoExt_FailThenPass": {
                            "type": "Folder",
                            "content": {
                                "frame_0.json": "File",
                                "frame_1.json": "File",
                                "frame_2.json": "File",
                                "frame_3.json": "File",
                                "frame_4.json": "File",
                                "frame_5.json": "File"
                            }
                        },
                        "TypedSelection_TextFiles_NoExt_FailThenPass.json": "File",
                        "TypedSelection_TextFiles_WithExt_FailThenPass": {
                            "type": "Folder",
                            "content": {
                                "frame_0.json": "File",
                                "frame_1.json": "File",
                                "frame_2.json": "File",
                                "frame_3.json": "File",
                                "frame_4.json": "File",
                                "frame_5.json": "File"
                            }
                        },
                        "TypedSelection_TextFiles_WithExt_FailThenPass.json": "File"
                    }
                },
                "Dialog_Font": {
                    "type": "Folder",
                    "content": {
                        "OpenAndClose": {
                            "type": "Folder",
                            "content": {
                                "frame_0.json": "File",
                                "frame_1.json": "File",
                                "frame_2.json": "File",
                                "frame_3.json": "File",
                                "frame_4.json": "File",
                                "frame_5.json": "File",
                                "frame_6.json": "File"
                            }
                        },
                        "OpenAndClose.json": "File",
                        "OpenAndClose_Simple": {
                            "type": "Folder",
                            "content": {
                                "frame_0.json": "File",
                                "frame_1.json": "File",
                                "frame_2.json": "File",
                                "frame_3.json": "File"
                            }
                        },
                        "OpenAndClose_Simple.json": "File"
                    }
                },
                "Dialog_Message": {
                    "type": "Folder",
                    "content": {
                        "OpenAndClose": {
                            "type": "Folder",
                            "content": {
                                "frame_0.json": "File",
                                "frame_1.json": "File",
                                "frame_10.json": "File",
                                "frame_11.json": "File",
                                "frame_12.json": "File",
                                "frame_13.json": "File",
                                "frame_14.json": "File",
                                "frame_2.json": "File",
                                "frame_3.json": "File",
                                "frame_4.json": "File",
                                "frame_5.json": "File",
                                "frame_6.json": "File",
                                "frame_7.json": "File",
                                "frame_8.json": "File",
                                "frame_9.json": "File"
                            }
                        },
                        "OpenAndClose.json": "File"
                    }
                },
                "FocusedAndDelete": {
                    "type": "Folder",
                    "content": {
                        "frame_0.json": "File",
                        "frame_1.json": "File",
                        "frame_2.json": "File"
                    }
                },
                "FocusedAndDelete.json": "File",
                "FocusedAndDisable": {
                    "type": "Folder",
                    "content": {
                        "frame_0.json": "File",
                        "frame_1.json": "File",
                        "frame_2.json": "File"
                    }
                },
                "FocusedAndDisable.json": "File",
                "FocusedAndHide": {
                    "type": "Folder",
                    "content": {
                        "frame_0.json": "File",
                        "frame_1.json": "File",
                        "frame_2.json": "File"
                    }
                },
                "FocusedAndHide.json": "File",
                "TabNavigate": {
                    "type": "Folder",
                    "content": {
                        "frame_0.json": "File",
                        "frame_1.json": "File",
                        "frame_2.json": "File",
                        "frame_3.json": "File",
                        "frame_4.json": "File",
                        "frame_5.json": "File",
                        "frame_6.json": "File",
                        "frame_7.json": "File"
                    }
                },
                "TabNavigate.json": "File",
                "TabNavigateWithContainer": {
                    "type": "Folder",
                    "content": {
                        "frame_0.json": "File",
                        "frame_1.json": "File",
                        "frame_10.json": "File",
                        "frame_11.json": "File",
                        "frame_2.json": "File",
                        "frame_3.json": "File",
                        "frame_4.json": "File",
                        "frame_5.json": "File",
                        "frame_6.json": "File",
                        "frame_7.json": "File",
                        "frame_8.json": "File",
                        "frame_9.json": "File"
                    }
                },
                "TabNavigateWithContainer.json": "File",
                "Tooltip": {
                    "type": "Folder",
                    "content": {
                        "ShowTooltipAndLeave": {
                            "type": "Folder",
                            "content": {
                                "frame_0.json": "File",
                                "frame_1.json": "File",
                                "frame_2.json": "File",
                                "frame_3.json": "File"
                            }
                        },
                        "ShowTooltipAndLeave.json": "File",
                        "ShowTooltipAndSwitchToAnother": {
                            "type": "Folder",
                            "content": {
                                "frame_0.json": "File",
                                "frame_1.json": "File",
                                "frame_2.json": "File",
                                "frame_3.json": "File",
                                "frame_4.json": "File",
                                "frame_5.json": "File"
                            }
                        },
                        "ShowTooltipAndSwitchToAnother.json": "File",
                        "ShowTooltipAndWaitForClosing": {
                            "type": "Folder",
                            "content": {
                                "frame_0.json": "File",
                                "frame_1.json": "File",
                                "frame_2.json": "File",
                                "frame_3.json": "File"
                            }
                        },
                        "ShowTooltipAndWaitForClosing.json": "File"
                    }
                },
                "Windows": {
                    "type": "Folder",
                    "content": {
                        "Closing": {
                            "type": "Folder",
                            "content": {
                                "frame_0.json": "File",
                                "frame_1.json": "File",
                                "frame_2.json": "File",
                                "frame_3.json": "File"
                            }
                        },
                        "Closing.json": "File",
                        "Dragging": {
                            "type": "Folder",
                            "content": {
                                "frame_0.json": "File",
                                "frame_1.json": "File",
                                "frame_2.json": "File",
                                "frame_3.json": "File"
                            }
                        },
                        "Dragging.json": "File",
                        "Enabling": {
                            "type": "Folder",
                            "content": {
                                "frame_0.json": "File",
                                "frame_1.json": "File",
                                "frame_2.json": "File",
                                "frame_3.json": "File"
                            }
                        },
                        "Enabling.json": "File",
                        "Order": {
                            "type": "Folder",
                            "content": {
                                "frame_0.json": "File",
                                "frame_1.json": "File",
                                "frame_2.json": "File",
                                "frame_3.json": "File"
                            }
                        },
                        "Order.json": "File",
                        "Resizing": {
                            "type": "Folder",
                            "content": {
                                "frame_0.json": "File",
                                "frame_1.json": "File",
                                "frame_2.json": "File",
                                "frame_3.json": "File",
                                "frame_4.json": "File",
                                "frame_5.json": "File",
                                "frame_6.json": "File",
                                "frame_7.json": "File",
                                "frame_8.json": "File",
                                "frame_9.json": "File"
                            }
                        },
                        "Resizing.json": "File",
                        "ShowModal": {
                            "type": "Folder",
                            "content": {
                                "frame_0.json": "File",
                                "frame_1.json": "File",
                                "frame_2.json": "File",
                                "frame_3.json": "File",
                                "frame_4.json": "File",
                                "frame_5.json": "File",
                                "frame_6.json": "File",
                                "frame_7.json": "File"
                            }
                        },
                        "ShowModal.json": "File"
                    }
                }
            }
        },
        "Controls": {
            "type": "Folder",
            "content": {
                "Basic": {
                    "type": "Folder",
                    "content": {
                        "GuiButton": {
                            "type": "Folder",
                            "content": {
                                "AcknowledgeChildControlMouseEvents": {
                                    "type": "Folder",
                                    "content": {
                                        "frame_0.json": "File",
                                        "frame_1.json": "File",
                                        "frame_2.json": "File"
                                    }
                                },
                                "AcknowledgeChildControlMouseEvents.json": "File",
                                "AutoFocus": {
                                    "type": "Folder",
                                    "content": {
                                        "frame_0.json": "File",
                                        "frame_1.json": "File",
                                        "frame_2.json": "File",
                                        "frame_3.json": "File",
                                        "frame_4.json": "File",
                                        "frame_5.json": "File",
                                        "frame_6.json": "File",
                                        "frame_7.json": "File"
                                    }
                                },
                                "AutoFocus.json": "File",
                                "ClickOnMouseDown": {
                                    "type": "Folder",
                                    "content": {
                                        "frame_0.json": "File",
                                        "frame_1.json": "File",
                                        "frame_2.json": "File",
                                        "frame_3.json": "File",
                                        "frame_4.json": "File"
                                    }
                                },
                                "ClickOnMouseDown.json": "File",
                                "ClickOnMouseUp": {
                                    "type": "Folder",
                                    "content": {
                                        "frame_0.json": "File",
                                        "frame_1.json": "File",
                                        "frame_2.json": "File",
                                        "frame_3.json": "File",
                                        "frame_4.json": "File"
                                    }
                                },
                                "ClickOnMouseUp.json": "File",
                                "Disabled": {
                                    "type": "Folder",
                                    "content": {
                                        "frame_0.json": "File",
                                        "frame_1.json": "File",
                                        "frame_2.json": "File",
                                        "frame_3.json": "File",
                                        "frame_4.json": "File",
                                        "frame_5.json": "File",
                                        "frame_6.json": "File"
                                    }
                                },
                                "Disabled.json": "File",
                                "IgnoreChildControlMouseEvents": {
                                    "type": "Folder",
                                    "content": {
                                        "frame_0.json": "File",
                                        "frame_1.json": "File",
                                        "frame_2.json": "File"
                                    }
                                },
                                "IgnoreChildControlMouseEvents.json": "File",
                                "PressEnter": {
                                    "type": "Folder",
                                    "content": {
                                        "frame_0.json": "File",
                                        "frame_1.json": "File",
                                        "frame_2.json": "File",
                                        "frame_3.json": "File"
                                    }
                                },
                                "PressEnter.json": "File",
                                "PressSpace": {
                                    "type": "Folder",
                                    "content": {
                                        "frame_0.json": "File",
                                        "frame_1.json": "File",
                                        "frame_2.json": "File",
                                        "frame_3.json": "File"
                                    }
                                },
                                "PressSpace.json": "File"
                            }
                        },
                        "GuiScroll": {
                            "type": "Folder",
                            "content": {
                                "HScroll": {
                                    "type": "Folder",
                                    "content": {
                                        "Click": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File",
                                                "frame_5.json": "File",
                                                "frame_6.json": "File"
                                            }
                                        },
                                        "Click.json": "File",
                                        "Key": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File",
                                                "frame_5.json": "File",
                                                "frame_6.json": "File",
                                                "frame_7.json": "File",
                                                "frame_8.json": "File",
                                                "frame_9.json": "File"
                                            }
                                        },
                                        "Key.json": "File",
                                        "Mouse": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File",
                                                "frame_5.json": "File",
                                                "frame_6.json": "File",
                                                "frame_7.json": "File"
                                            }
                                        },
                                        "Mouse.json": "File",
                                        "Properties": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File"
                                            }
                                        },
                                        "Properties.json": "File"
                                    }
                                },
                                "HTracker": {
                                    "type": "Folder",
                                    "content": {
                                        "Key": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File",
                                                "frame_5.json": "File",
                                                "frame_6.json": "File",
                                                "frame_7.json": "File",
                                                "frame_8.json": "File",
                                                "frame_9.json": "File"
                                            }
                                        },
                                        "Key.json": "File",
                                        "Mouse": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File",
                                                "frame_5.json": "File",
                                                "frame_6.json": "File",
                                                "frame_7.json": "File"
                                            }
                                        },
                                        "Mouse.json": "File",
                                        "Properties": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File"
                                            }
                                        },
                                        "Properties.json": "File"
                                    }
                                },
                                "ProgressBar": {
                                    "type": "Folder",
                                    "content": {
                                        "frame_0.json": "File",
                                        "frame_1.json": "File",
                                        "frame_2.json": "File",
                                        "frame_3.json": "File",
                                        "frame_4.json": "File",
                                        "frame_5.json": "File"
                                    }
                                },
                                "ProgressBar.json": "File",
                                "VScroll": {
                                    "type": "Folder",
                                    "content": {
                                        "Click": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File",
                                                "frame_5.json": "File",
                                                "frame_6.json": "File"
                                            }
                                        },
                                        "Click.json": "File",
                                        "Key": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File",
                                                "frame_5.json": "File",
                                                "frame_6.json": "File",
                                                "frame_7.json": "File",
                                                "frame_8.json": "File",
                                                "frame_9.json": "File"
                                            }
                                        },
                                        "Key.json": "File",
                                        "Mouse": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File",
                                                "frame_5.json": "File",
                                                "frame_6.json": "File",
                                                "frame_7.json": "File"
                                            }
                                        },
                                        "Mouse.json": "File",
                                        "Properties": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File"
                                            }
                                        },
                                        "Properties.json": "File"
                                    }
                                },
                                "VTracker": {
                                    "type": "Folder",
                                    "content": {
                                        "Key": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File",
                                                "frame_5.json": "File",
                                                "frame_6.json": "File",
                                                "frame_7.json": "File",
                                                "frame_8.json": "File",
                                                "frame_9.json": "File"
                                            }
                                        },
                                        "Key.json": "File",
                                        "Mouse": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File",
                                                "frame_5.json": "File",
                                                "frame_6.json": "File",
                                                "frame_7.json": "File"
                                            }
                                        },
                                        "Mouse.json": "File",
                                        "Properties": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File"
                                            }
                                        },
                                        "Properties.json": "File"
                                    }
                                }
                            }
                        },
                        "GuiScrollContainer": {
                            "type": "Folder",
                            "content": {
                                "AlwaysInvisible": {
                                    "type": "Folder",
                                    "content": {
                                        "frame_0.json": "File",
                                        "frame_1.json": "File",
                                        "frame_10.json": "File",
                                        "frame_11.json": "File",
                                        "frame_2.json": "File",
                                        "frame_3.json": "File",
                                        "frame_4.json": "File",
                                        "frame_5.json": "File",
                                        "frame_6.json": "File",
                                        "frame_7.json": "File",
                                        "frame_8.json": "File",
                                        "frame_9.json": "File"
                                    }
                                },
                                "AlwaysInvisible.json": "File",
                                "AlwaysVisible": {
                                    "type": "Folder",
                                    "content": {
                                        "frame_0.json": "File",
                                        "frame_1.json": "File",
                                        "frame_10.json": "File",
                                        "frame_2.json": "File",
                                        "frame_3.json": "File",
                                        "frame_4.json": "File",
                                        "frame_5.json": "File",
                                        "frame_6.json": "File",
                                        "frame_7.json": "File",
                                        "frame_8.json": "File",
                                        "frame_9.json": "File"
                                    }
                                },
                                "AlwaysVisible.json": "File",
                                "ExtendToFullSize": {
                                    "type": "Folder",
                                    "content": {
                                        "frame_0.json": "File",
                                        "frame_1.json": "File",
                                        "frame_2.json": "File",
                                        "frame_3.json": "File",
                                        "frame_4.json": "File"
                                    }
                                },
                                "ExtendToFullSize.json": "File"
                            }
                        },
                        "GuiSelectableButton": {
                            "type": "Folder",
                            "content": {
                                "AutoSelection": {
                                    "type": "Folder",
                                    "content": {
                                        "frame_0.json": "File",
                                        "frame_1.json": "File",
                                        "frame_2.json": "File",
                                        "frame_3.json": "File",
                                        "frame_4.json": "File"
                                    }
                                },
                                "AutoSelection.json": "File",
                                "MutexGroup": {
                                    "type": "Folder",
                                    "content": {
                                        "frame_0.json": "File",
                                        "frame_1.json": "File",
                                        "frame_2.json": "File",
                                        "frame_3.json": "File",
                                        "frame_4.json": "File"
                                    }
                                },
                                "MutexGroup.json": "File",
                                "MutexSelection": {
                                    "type": "Folder",
                                    "content": {
                                        "frame_0.json": "File",
                                        "frame_1.json": "File",
                                        "frame_2.json": "File",
                                        "frame_3.json": "File",
                                        "frame_4.json": "File"
                                    }
                                },
                                "MutexSelection.json": "File"
                            }
                        },
                        "GuiTab": {
                            "type": "Folder",
                            "content": {
                                "ModifyPages": {
                                    "type": "Folder",
                                    "content": {
                                        "frame_0.json": "File",
                                        "frame_1.json": "File",
                                        "frame_2.json": "File",
                                        "frame_3.json": "File",
                                        "frame_4.json": "File",
                                        "frame_5.json": "File"
                                    }
                                },
                                "ModifyPages.json": "File",
                                "Navigation": {
                                    "type": "Folder",
                                    "content": {
                                        "frame_0.json": "File",
                                        "frame_1.json": "File",
                                        "frame_2.json": "File",
                                        "frame_3.json": "File",
                                        "frame_4.json": "File"
                                    }
                                },
                                "Navigation.json": "File",
                                "NavigationAlt": {
                                    "type": "Folder",
                                    "content": {
                                        "frame_0.json": "File",
                                        "frame_1.json": "File",
                                        "frame_2.json": "File",
                                        "frame_3.json": "File",
                                        "frame_4.json": "File",
                                        "frame_5.json": "File",
                                        "frame_6.json": "File",
                                        "frame_7.json": "File",
                                        "frame_8.json": "File"
                                    }
                                },
                                "NavigationAlt.json": "File",
                                "NavigationTab": {
                                    "type": "Folder",
                                    "content": {
                                        "frame_0.json": "File",
                                        "frame_1.json": "File",
                                        "frame_2.json": "File",
                                        "frame_3.json": "File",
                                        "frame_4.json": "File",
                                        "frame_5.json": "File",
                                        "frame_6.json": "File",
                                        "frame_7.json": "File",
                                        "frame_8.json": "File",
                                        "frame_9.json": "File"
                                    }
                                },
                                "NavigationTab.json": "File"
                            }
                        }
                    }
                },
                "CoreApplication": {
                    "type": "Folder",
                    "content": {
                        "GuiControl": {
                            "type": "Folder",
                            "content": {
                                "AltFocus": {
                                    "type": "Folder",
                                    "content": {
                                        "frame_0.json": "File",
                                        "frame_1.json": "File"
                                    }
                                },
                                "AltFocus.json": "File",
                                "AltLabel": {
                                    "type": "Folder",
                                    "content": {
                                        "frame_0.json": "File",
                                        "frame_1.json": "File",
                                        "frame_2.json": "File",
                                        "frame_3.json": "File",
                                        "frame_4.json": "File"
                                    }
                                },
                                "AltLabel.json": "File",
                                "Context": {
                                    "type": "Folder",
                                    "content": {
                                        "frame_0.json": "File",
                                        "frame_1.json": "File",
                                        "frame_2.json": "File",
                                        "frame_3.json": "File"
                                    }
                                },
                                "Context.json": "File",
                                "Enable": {
                                    "type": "Folder",
                                    "content": {
                                        "frame_0.json": "File",
                                        "frame_1.json": "File",
                                        "frame_2.json": "File",
                                        "frame_3.json": "File"
                                    }
                                },
                                "Enable.json": "File",
                                "Focus": {
                                    "type": "Folder",
                                    "content": {
                                        "frame_0.json": "File",
                                        "frame_1.json": "File",
                                        "frame_2.json": "File",
                                        "frame_3.json": "File",
                                        "frame_4.json": "File",
                                        "frame_5.json": "File"
                                    }
                                },
                                "Focus.json": "File",
                                "Font": {
                                    "type": "Folder",
                                    "content": {
                                        "frame_0.json": "File",
                                        "frame_1.json": "File"
                                    }
                                },
                                "Font.json": "File",
                                "MyControlTemplate": {
                                    "type": "Folder",
                                    "content": {
                                        "frame_0.json": "File",
                                        "frame_1.json": "File",
                                        "frame_2.json": "File",
                                        "frame_3.json": "File",
                                        "frame_4.json": "File"
                                    }
                                },
                                "MyControlTemplate.json": "File",
                                "Visible": {
                                    "type": "Folder",
                                    "content": {
                                        "frame_0.json": "File",
                                        "frame_1.json": "File",
                                        "frame_2.json": "File",
                                        "frame_3.json": "File",
                                        "frame_4.json": "File",
                                        "frame_5.json": "File"
                                    }
                                },
                                "Visible.json": "File"
                            }
                        },
                        "GuiLabel": {
                            "type": "Folder",
                            "content": {
                                "frame_0.json": "File",
                                "frame_1.json": "File",
                                "frame_2.json": "File",
                                "frame_3.json": "File",
                                "frame_4.json": "File"
                            }
                        },
                        "GuiLabel.json": "File",
                        "WindowFeatures": {
                            "type": "Folder",
                            "content": {
                                "frame_0.json": "File",
                                "frame_1.json": "File",
                                "frame_2.json": "File",
                                "frame_3.json": "File",
                                "frame_4.json": "File",
                                "frame_5.json": "File",
                                "frame_6.json": "File",
                                "frame_7.json": "File"
                            }
                        },
                        "WindowFeatures.json": "File",
                        "WindowMaximized": {
                            "type": "Folder",
                            "content": {
                                "frame_0.json": "File"
                            }
                        },
                        "WindowMaximized.json": "File",
                        "WindowSizing": {
                            "type": "Folder",
                            "content": {
                                "frame_0.json": "File",
                                "frame_1.json": "File",
                                "frame_2.json": "File",
                                "frame_3.json": "File",
                                "frame_4.json": "File",
                                "frame_5.json": "File",
                                "frame_6.json": "File",
                                "frame_7.json": "File"
                            }
                        },
                        "WindowSizing.json": "File"
                    }
                },
                "Editor": {
                    "type": "Folder",
                    "content": {
                        "Features": {
                            "type": "Folder",
                            "content": {
                                "InlineObject": {
                                    "type": "Folder",
                                    "content": {
                                        "frame_0.json": "File",
                                        "frame_1.json": "File",
                                        "frame_2.json": "File",
                                        "frame_3.json": "File",
                                        "frame_4.json": "File",
                                        "frame_5.json": "File"
                                    }
                                },
                                "InlineObject.json": "File",
                                "InlineObjectWithCaret": {
                                    "type": "Folder",
                                    "content": {
                                        "frame_0.json": "File",
                                        "frame_1.json": "File",
                                        "frame_10.json": "File",
                                        "frame_2.json": "File",
                                        "frame_3.json": "File",
                                        "frame_4.json": "File",
                                        "frame_5.json": "File",
                                        "frame_6.json": "File",
                                        "frame_7.json": "File",
                                        "frame_8.json": "File",
                                        "frame_9.json": "File"
                                    }
                                },
                                "InlineObjectWithCaret.json": "File",
                                "RichText": {
                                    "type": "Folder",
                                    "content": {
                                        "Hyperlink_MultiParagraph_ActivateExecute": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File",
                                                "frame_5.json": "File",
                                                "frame_6.json": "File",
                                                "frame_7.json": "File"
                                            }
                                        },
                                        "Hyperlink_MultiParagraph_ActivateExecute.json": "File",
                                        "Hyperlink_Overlap_Remove_DoesNotLeaveStaleActive": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File",
                                                "frame_5.json": "File",
                                                "frame_6.json": "File",
                                                "frame_7.json": "File",
                                                "frame_8.json": "File"
                                            }
                                        },
                                        "Hyperlink_Overlap_Remove_DoesNotLeaveStaleActive.json": "File",
                                        "Hyperlink_SingleParagraph_ActivateExecute": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File"
                                            }
                                        },
                                        "Hyperlink_SingleParagraph_ActivateExecute.json": "File",
                                        "Hyperlink_SingleParagraph_EditRemove_Model": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File"
                                            }
                                        },
                                        "Hyperlink_SingleParagraph_EditRemove_Model.json": "File",
                                        "MultiParagraph_AllProperties_OneCall": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File"
                                            }
                                        },
                                        "MultiParagraph_AllProperties_OneCall.json": "File",
                                        "MultiParagraph_Color_OneCall": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File"
                                            }
                                        },
                                        "MultiParagraph_Color_OneCall.json": "File",
                                        "MultiParagraph_FontStyle_OneCall": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File"
                                            }
                                        },
                                        "MultiParagraph_FontStyle_OneCall.json": "File",
                                        "MultiParagraph_Font_OneCall": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File"
                                            }
                                        },
                                        "MultiParagraph_Font_OneCall.json": "File",
                                        "MultiParagraph_Overlap_DifferentProperties_BoldThenColor": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File"
                                            }
                                        },
                                        "MultiParagraph_Overlap_DifferentProperties_BoldThenColor.json": "File",
                                        "MultiParagraph_Overlap_SameProperty_BoldTrueThenFalse": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File"
                                            }
                                        },
                                        "MultiParagraph_Overlap_SameProperty_BoldTrueThenFalse.json": "File",
                                        "MultiParagraph_Overlap_SameProperty_FontFace": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File"
                                            }
                                        },
                                        "MultiParagraph_Overlap_SameProperty_FontFace.json": "File",
                                        "SingleParagraph_AllProperties_SameRange": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File"
                                            }
                                        },
                                        "SingleParagraph_AllProperties_SameRange.json": "File",
                                        "SingleParagraph_Color_OneCall": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File"
                                            }
                                        },
                                        "SingleParagraph_Color_OneCall.json": "File",
                                        "SingleParagraph_FontStyle_OneCall": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File"
                                            }
                                        },
                                        "SingleParagraph_FontStyle_OneCall.json": "File",
                                        "SingleParagraph_Font_OneCall": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File"
                                            }
                                        },
                                        "SingleParagraph_Font_OneCall.json": "File",
                                        "SingleParagraph_Overlap_DifferentProperties_BoldThenColor": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File"
                                            }
                                        },
                                        "SingleParagraph_Overlap_DifferentProperties_BoldThenColor.json": "File",
                                        "SingleParagraph_Overlap_SameProperty_BoldTrueThenFalse": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File"
                                            }
                                        },
                                        "SingleParagraph_Overlap_SameProperty_BoldTrueThenFalse.json": "File",
                                        "SingleParagraph_Overlap_SameProperty_FontFace": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File"
                                            }
                                        },
                                        "SingleParagraph_Overlap_SameProperty_FontFace.json": "File"
                                    }
                                },
                                "Styles": {
                                    "type": "Folder",
                                    "content": {
                                        "EditStyleName": {
                                            "type": "Folder",
                                            "content": {
                                                "MultiParagraph_AcrossParagraphs": {
                                                    "type": "Folder",
                                                    "content": {
                                                        "frame_0.json": "File",
                                                        "frame_1.json": "File"
                                                    }
                                                },
                                                "MultiParagraph_AcrossParagraphs.json": "File",
                                                "MultiParagraph_FullDocument": {
                                                    "type": "Folder",
                                                    "content": {
                                                        "frame_0.json": "File",
                                                        "frame_1.json": "File"
                                                    }
                                                },
                                                "MultiParagraph_FullDocument.json": "File",
                                                "SingleParagraph_AdjacentRanges": {
                                                    "type": "Folder",
                                                    "content": {
                                                        "frame_0.json": "File",
                                                        "frame_1.json": "File"
                                                    }
                                                },
                                                "SingleParagraph_AdjacentRanges.json": "File",
                                                "SingleParagraph_Overwrite": {
                                                    "type": "Folder",
                                                    "content": {
                                                        "frame_0.json": "File",
                                                        "frame_1.json": "File"
                                                    }
                                                },
                                                "SingleParagraph_Overwrite.json": "File",
                                                "SingleParagraph_PartialRange": {
                                                    "type": "Folder",
                                                    "content": {
                                                        "frame_0.json": "File",
                                                        "frame_1.json": "File"
                                                    }
                                                },
                                                "SingleParagraph_PartialRange.json": "File",
                                                "SingleParagraph_RegisteredStyle": {
                                                    "type": "Folder",
                                                    "content": {
                                                        "frame_0.json": "File",
                                                        "frame_1.json": "File"
                                                    }
                                                },
                                                "SingleParagraph_RegisteredStyle.json": "File",
                                                "SingleParagraph_UnregisteredStyle": {
                                                    "type": "Folder",
                                                    "content": {
                                                        "frame_0.json": "File",
                                                        "frame_1.json": "File"
                                                    }
                                                },
                                                "SingleParagraph_UnregisteredStyle.json": "File"
                                            }
                                        },
                                        "RemoveStyleName": {
                                            "type": "Folder",
                                            "content": {
                                                "MultiParagraph_EdgeRetention": {
                                                    "type": "Folder",
                                                    "content": {
                                                        "frame_0.json": "File",
                                                        "frame_1.json": "File"
                                                    }
                                                },
                                                "MultiParagraph_EdgeRetention.json": "File",
                                                "MultiParagraph_SameRange": {
                                                    "type": "Folder",
                                                    "content": {
                                                        "frame_0.json": "File",
                                                        "frame_1.json": "File"
                                                    }
                                                },
                                                "MultiParagraph_SameRange.json": "File",
                                                "SingleParagraph_FullRange": {
                                                    "type": "Folder",
                                                    "content": {
                                                        "frame_0.json": "File",
                                                        "frame_1.json": "File"
                                                    }
                                                },
                                                "SingleParagraph_FullRange.json": "File",
                                                "SingleParagraph_NoStyle": {
                                                    "type": "Folder",
                                                    "content": {
                                                        "frame_0.json": "File",
                                                        "frame_1.json": "File"
                                                    }
                                                },
                                                "SingleParagraph_NoStyle.json": "File",
                                                "SingleParagraph_OverlappingStyles": {
                                                    "type": "Folder",
                                                    "content": {
                                                        "frame_0.json": "File",
                                                        "frame_1.json": "File"
                                                    }
                                                },
                                                "SingleParagraph_OverlappingStyles.json": "File",
                                                "SingleParagraph_PartialRange": {
                                                    "type": "Folder",
                                                    "content": {
                                                        "frame_0.json": "File",
                                                        "frame_1.json": "File"
                                                    }
                                                },
                                                "SingleParagraph_PartialRange.json": "File"
                                            }
                                        },
                                        "RenameStyle": {
                                            "type": "Folder",
                                            "content": {
                                                "ExistingNameFails": {
                                                    "type": "Folder",
                                                    "content": {
                                                        "frame_0.json": "File",
                                                        "frame_1.json": "File"
                                                    }
                                                },
                                                "ExistingNameFails.json": "File",
                                                "MultiParagraph": {
                                                    "type": "Folder",
                                                    "content": {
                                                        "frame_0.json": "File",
                                                        "frame_1.json": "File"
                                                    }
                                                },
                                                "MultiParagraph.json": "File",
                                                "MultipleRanges": {
                                                    "type": "Folder",
                                                    "content": {
                                                        "frame_0.json": "File",
                                                        "frame_1.json": "File"
                                                    }
                                                },
                                                "MultipleRanges.json": "File",
                                                "NonExistentFails": {
                                                    "type": "Folder",
                                                    "content": {
                                                        "frame_0.json": "File",
                                                        "frame_1.json": "File"
                                                    }
                                                },
                                                "NonExistentFails.json": "File",
                                                "ParentReference": {
                                                    "type": "Folder",
                                                    "content": {
                                                        "frame_0.json": "File",
                                                        "frame_1.json": "File"
                                                    }
                                                },
                                                "ParentReference.json": "File",
                                                "Success": {
                                                    "type": "Folder",
                                                    "content": {
                                                        "frame_0.json": "File",
                                                        "frame_1.json": "File"
                                                    }
                                                },
                                                "Success.json": "File"
                                            }
                                        },
                                        "SummarizeStyleName": {
                                            "type": "Folder",
                                            "content": {
                                                "MixedStyles": {
                                                    "type": "Folder",
                                                    "content": {
                                                        "frame_0.json": "File",
                                                        "frame_1.json": "File"
                                                    }
                                                },
                                                "MixedStyles.json": "File",
                                                "MultiParagraph_Mixed": {
                                                    "type": "Folder",
                                                    "content": {
                                                        "frame_0.json": "File",
                                                        "frame_1.json": "File"
                                                    }
                                                },
                                                "MultiParagraph_Mixed.json": "File",
                                                "MultiParagraph_Uniform": {
                                                    "type": "Folder",
                                                    "content": {
                                                        "frame_0.json": "File",
                                                        "frame_1.json": "File"
                                                    }
                                                },
                                                "MultiParagraph_Uniform.json": "File",
                                                "NoStyle": {
                                                    "type": "Folder",
                                                    "content": {
                                                        "frame_0.json": "File",
                                                        "frame_1.json": "File"
                                                    }
                                                },
                                                "NoStyle.json": "File",
                                                "PartiallyStyled": {
                                                    "type": "Folder",
                                                    "content": {
                                                        "frame_0.json": "File",
                                                        "frame_1.json": "File"
                                                    }
                                                },
                                                "PartiallyStyled.json": "File",
                                                "ReversedRange": {
                                                    "type": "Folder",
                                                    "content": {
                                                        "frame_0.json": "File",
                                                        "frame_1.json": "File"
                                                    }
                                                },
                                                "ReversedRange.json": "File",
                                                "UniformStyle": {
                                                    "type": "Folder",
                                                    "content": {
                                                        "frame_0.json": "File",
                                                        "frame_1.json": "File"
                                                    }
                                                },
                                                "UniformStyle.json": "File"
                                            }
                                        },
                                        "UndoRedo": {
                                            "type": "Folder",
                                            "content": {
                                                "EditStyleName": {
                                                    "type": "Folder",
                                                    "content": {
                                                        "MultipleEdits_UndoAll_ReturnsToOriginal": {
                                                            "type": "Folder",
                                                            "content": {
                                                                "frame_0.json": "File",
                                                                "frame_1.json": "File",
                                                                "frame_2.json": "File",
                                                                "frame_3.json": "File"
                                                            }
                                                        },
                                                        "MultipleEdits_UndoAll_ReturnsToOriginal.json": "File",
                                                        "RedoHistoryDropped_OnNewEdit": {
                                                            "type": "Folder",
                                                            "content": {
                                                                "frame_0.json": "File",
                                                                "frame_1.json": "File"
                                                            }
                                                        },
                                                        "RedoHistoryDropped_OnNewEdit.json": "File",
                                                        "Redo_EditStyleName": {
                                                            "type": "Folder",
                                                            "content": {
                                                                "frame_0.json": "File",
                                                                "frame_1.json": "File",
                                                                "frame_2.json": "File"
                                                            }
                                                        },
                                                        "Redo_EditStyleName.json": "File",
                                                        "UndoRedo_ReachingHistoryEnds_ReturnsFalse_AndStateCorrect": {
                                                            "type": "Folder",
                                                            "content": {
                                                                "frame_0.json": "File",
                                                                "frame_1.json": "File",
                                                                "frame_2.json": "File"
                                                            }
                                                        },
                                                        "UndoRedo_ReachingHistoryEnds_ReturnsFalse_AndStateCorrect.json": "File",
                                                        "Undo_EditStyleName": {
                                                            "type": "Folder",
                                                            "content": {
                                                                "frame_0.json": "File",
                                                                "frame_1.json": "File",
                                                                "frame_2.json": "File"
                                                            }
                                                        },
                                                        "Undo_EditStyleName.json": "File"
                                                    }
                                                },
                                                "RemoveStyleName": {
                                                    "type": "Folder",
                                                    "content": {
                                                        "CanUndoCanRedo_Transitions": {
                                                            "type": "Folder",
                                                            "content": {
                                                                "frame_0.json": "File",
                                                                "frame_1.json": "File",
                                                                "frame_2.json": "File"
                                                            }
                                                        },
                                                        "CanUndoCanRedo_Transitions.json": "File",
                                                        "Redo_RemoveStyleName": {
                                                            "type": "Folder",
                                                            "content": {
                                                                "frame_0.json": "File",
                                                                "frame_1.json": "File",
                                                                "frame_2.json": "File"
                                                            }
                                                        },
                                                        "Redo_RemoveStyleName.json": "File",
                                                        "Undo_RemoveStyleName": {
                                                            "type": "Folder",
                                                            "content": {
                                                                "frame_0.json": "File",
                                                                "frame_1.json": "File",
                                                                "frame_2.json": "File"
                                                            }
                                                        },
                                                        "Undo_RemoveStyleName.json": "File"
                                                    }
                                                },
                                                "RenameStyle": {
                                                    "type": "Folder",
                                                    "content": {
                                                        "MultipleRenames_UndoAll_ReturnsToA": {
                                                            "type": "Folder",
                                                            "content": {
                                                                "frame_0.json": "File",
                                                                "frame_1.json": "File"
                                                            }
                                                        },
                                                        "MultipleRenames_UndoAll_ReturnsToA.json": "File",
                                                        "Redo_RenameStyle": {
                                                            "type": "Folder",
                                                            "content": {
                                                                "frame_0.json": "File",
                                                                "frame_1.json": "File"
                                                            }
                                                        },
                                                        "Redo_RenameStyle.json": "File",
                                                        "Redo_RenameStyle_ParentReferences": {
                                                            "type": "Folder",
                                                            "content": {
                                                                "frame_0.json": "File",
                                                                "frame_1.json": "File"
                                                            }
                                                        },
                                                        "Redo_RenameStyle_ParentReferences.json": "File",
                                                        "Undo_RenameStyle": {
                                                            "type": "Folder",
                                                            "content": {
                                                                "frame_0.json": "File",
                                                                "frame_1.json": "File"
                                                            }
                                                        },
                                                        "Undo_RenameStyle.json": "File",
                                                        "Undo_RenameStyle_ParentReferences": {
                                                            "type": "Folder",
                                                            "content": {
                                                                "frame_0.json": "File",
                                                                "frame_1.json": "File"
                                                            }
                                                        },
                                                        "Undo_RenameStyle_ParentReferences.json": "File"
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        },
                        "GuiDocumentLabel": {
                            "type": "Folder",
                            "content": {
                                "Basic": {
                                    "type": "Folder",
                                    "content": {
                                        "frame_0.json": "File",
                                        "frame_1.json": "File",
                                        "frame_2.json": "File"
                                    }
                                },
                                "Basic.json": "File",
                                "Key": {
                                    "type": "Folder",
                                    "content": {
                                        "Clipboard_CtrlC_CopiesSelection_TextUnchanged": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File"
                                            }
                                        },
                                        "Clipboard_CtrlC_CopiesSelection_TextUnchanged.json": "File",
                                        "Clipboard_CtrlV_EmptyClipboard_NoChange": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File"
                                            }
                                        },
                                        "Clipboard_CtrlV_EmptyClipboard_NoChange.json": "File",
                                        "Clipboard_CtrlV_PastesAtCaret": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File"
                                            }
                                        },
                                        "Clipboard_CtrlV_PastesAtCaret.json": "File",
                                        "Clipboard_CtrlV_ReplacesSelection": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File"
                                            }
                                        },
                                        "Clipboard_CtrlV_ReplacesSelection.json": "File",
                                        "Clipboard_CtrlX_CutsSelection_TextUpdated": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File"
                                            }
                                        },
                                        "Clipboard_CtrlX_CutsSelection_TextUpdated.json": "File",
                                        "Clipboard_Paragraph_CtrlC_CtrlV_Roundtrip_PreservesParagraphAndLineBreakStructure": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File"
                                            }
                                        },
                                        "Clipboard_Paragraph_CtrlC_CtrlV_Roundtrip_PreservesParagraphAndLineBreakStructure.json": "File",
                                        "Clipboard_Paragraph_CtrlV_DoubleCRLF_CreatesNewParagraph": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File"
                                            }
                                        },
                                        "Clipboard_Paragraph_CtrlV_DoubleCRLF_CreatesNewParagraph.json": "File",
                                        "Clipboard_Paragraph_CtrlV_SingleCRLF_StaysInParagraph": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File"
                                            }
                                        },
                                        "Clipboard_Paragraph_CtrlV_SingleCRLF_StaysInParagraph.json": "File",
                                        "Clipboard_Paragraph_CtrlV_TripleCRLF_FollowsParserRule": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File"
                                            }
                                        },
                                        "Clipboard_Paragraph_CtrlV_TripleCRLF_FollowsParserRule.json": "File",
                                        "Deletion_BackspaceAtStart_NoChange": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File"
                                            }
                                        },
                                        "Deletion_BackspaceAtStart_NoChange.json": "File",
                                        "Deletion_Backspace_DeletesPreviousChar": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File"
                                            }
                                        },
                                        "Deletion_Backspace_DeletesPreviousChar.json": "File",
                                        "Deletion_Backspace_DeletesSelection": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File"
                                            }
                                        },
                                        "Deletion_Backspace_DeletesSelection.json": "File",
                                        "Deletion_DeleteAtEnd_NoChange": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File"
                                            }
                                        },
                                        "Deletion_DeleteAtEnd_NoChange.json": "File",
                                        "Deletion_Delete_DeletesNextChar": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File"
                                            }
                                        },
                                        "Deletion_Delete_DeletesNextChar.json": "File",
                                        "Deletion_Delete_DeletesSelection": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File"
                                            }
                                        },
                                        "Deletion_Delete_DeletesSelection.json": "File",
                                        "EnterCRLF_Paragraph_CtrlEnter_InsertsLineBreakInParagraph": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File"
                                            }
                                        },
                                        "EnterCRLF_Paragraph_CtrlEnter_InsertsLineBreakInParagraph.json": "File",
                                        "EnterCRLF_Paragraph_Enter_CreatesNewParagraph": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File"
                                            }
                                        },
                                        "EnterCRLF_Paragraph_Enter_CreatesNewParagraph.json": "File",
                                        "NavigationParagraph_CtrlHomeEnd_JumpsToDocumentEdges": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File"
                                            }
                                        },
                                        "NavigationParagraph_CtrlHomeEnd_JumpsToDocumentEdges.json": "File",
                                        "NavigationParagraph_End_Escalation_Line_Paragraph_Document": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File"
                                            }
                                        },
                                        "NavigationParagraph_End_Escalation_Line_Paragraph_Document.json": "File",
                                        "NavigationParagraph_Home_Escalation_Line_Paragraph_Document": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File"
                                            }
                                        },
                                        "NavigationParagraph_Home_Escalation_Line_Paragraph_Document.json": "File",
                                        "NavigationParagraph_LeftRight_Boundary_JumpsAcrossParagraphs": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File"
                                            }
                                        },
                                        "NavigationParagraph_LeftRight_Boundary_JumpsAcrossParagraphs.json": "File",
                                        "NavigationParagraph_PageUpPageDown_MovesVerticallyByViewport": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File",
                                                "frame_5.json": "File"
                                            }
                                        },
                                        "NavigationParagraph_PageUpPageDown_MovesVerticallyByViewport.json": "File",
                                        "NavigationParagraph_UpDown_MovesAcrossLinesAndParagraphs": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File"
                                            }
                                        },
                                        "NavigationParagraph_UpDown_MovesAcrossLinesAndParagraphs.json": "File",
                                        "Navigation_ArrowKeys_MoveCaret": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File"
                                            }
                                        },
                                        "Navigation_ArrowKeys_MoveCaret.json": "File",
                                        "Navigation_CtrlWithNavigation_DoesNotChangeBehavior": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File"
                                            }
                                        },
                                        "Navigation_CtrlWithNavigation_DoesNotChangeBehavior.json": "File",
                                        "Navigation_HomeEnd_MoveCaretToEdges": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File"
                                            }
                                        },
                                        "Navigation_HomeEnd_MoveCaretToEdges.json": "File",
                                        "Navigation_PageKeys_NoEffectInSingleline": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File"
                                            }
                                        },
                                        "Navigation_PageKeys_NoEffectInSingleline.json": "File",
                                        "Navigation_ShiftArrow_ExtendsSelection": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File"
                                            }
                                        },
                                        "Navigation_ShiftArrow_ExtendsSelection.json": "File",
                                        "Navigation_ShiftHomeEnd_SelectToEdges": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File"
                                            }
                                        },
                                        "Navigation_ShiftHomeEnd_SelectToEdges.json": "File",
                                        "Navigation_UpDown_NoEffectInSingleline": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File"
                                            }
                                        },
                                        "Navigation_UpDown_NoEffectInSingleline.json": "File",
                                        "Scaffold_SmokeTest": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File"
                                            }
                                        },
                                        "Scaffold_SmokeTest.json": "File",
                                        "Typing_TypeString_IgnoresWhenCtrlPressed": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File"
                                            }
                                        },
                                        "Typing_TypeString_IgnoresWhenCtrlPressed.json": "File",
                                        "Typing_TypeString_InsertsPlainText": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File"
                                            }
                                        },
                                        "Typing_TypeString_InsertsPlainText.json": "File",
                                        "Typing_TypeString_InsertsTab_WhenAcceptTabInput": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File"
                                            }
                                        },
                                        "Typing_TypeString_InsertsTab_WhenAcceptTabInput.json": "File",
                                        "Typing_TypeString_ReplacesSelection": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File"
                                            }
                                        },
                                        "Typing_TypeString_ReplacesSelection.json": "File",
                                        "UndoRedo_ClearUndoRedo_DeletesAllHistory": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File"
                                            }
                                        },
                                        "UndoRedo_ClearUndoRedo_DeletesAllHistory.json": "File",
                                        "UndoRedo_CtrlZ_UndoesDeletion": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File"
                                            }
                                        },
                                        "UndoRedo_CtrlZ_UndoesDeletion.json": "File",
                                        "UndoRedo_CtrlZ_UndoesTyping_AndCtrlY_Redoes": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File"
                                            }
                                        },
                                        "UndoRedo_CtrlZ_UndoesTyping_AndCtrlY_Redoes.json": "File",
                                        "UndoRedo_UndoRedo_ReachingHistoryEnds_ReturnsFalse_AndStateCorrect": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File"
                                            }
                                        },
                                        "UndoRedo_UndoRedo_ReachingHistoryEnds_ReturnsFalse_AndStateCorrect.json": "File"
                                    }
                                },
                                "Typing": {
                                    "type": "Folder",
                                    "content": {
                                        "frame_0.json": "File",
                                        "frame_1.json": "File",
                                        "frame_2.json": "File",
                                        "frame_3.json": "File",
                                        "frame_4.json": "File",
                                        "frame_5.json": "File",
                                        "frame_6.json": "File"
                                    }
                                },
                                "Typing.json": "File"
                            }
                        },
                        "GuiDocumentTextBox": {
                            "type": "Folder",
                            "content": {
                                "Basic": {
                                    "type": "Folder",
                                    "content": {
                                        "frame_0.json": "File",
                                        "frame_1.json": "File",
                                        "frame_2.json": "File"
                                    }
                                },
                                "Basic.json": "File",
                                "Key": {
                                    "type": "Folder",
                                    "content": {
                                        "Clipboard_CtrlC_CopiesSelection_TextUnchanged": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File"
                                            }
                                        },
                                        "Clipboard_CtrlC_CopiesSelection_TextUnchanged.json": "File",
                                        "Clipboard_CtrlV_EmptyClipboard_NoChange": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File"
                                            }
                                        },
                                        "Clipboard_CtrlV_EmptyClipboard_NoChange.json": "File",
                                        "Clipboard_CtrlV_PastesAtCaret": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File"
                                            }
                                        },
                                        "Clipboard_CtrlV_PastesAtCaret.json": "File",
                                        "Clipboard_CtrlV_ReplacesSelection": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File"
                                            }
                                        },
                                        "Clipboard_CtrlV_ReplacesSelection.json": "File",
                                        "Clipboard_CtrlX_CutsSelection_TextUpdated": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File"
                                            }
                                        },
                                        "Clipboard_CtrlX_CutsSelection_TextUpdated.json": "File",
                                        "Clipboard_Paragraph_CtrlC_CtrlV_Roundtrip_PreservesParagraphAndLineBreakStructure": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File"
                                            }
                                        },
                                        "Clipboard_Paragraph_CtrlC_CtrlV_Roundtrip_PreservesParagraphAndLineBreakStructure.json": "File",
                                        "Clipboard_Paragraph_CtrlV_DoubleCRLF_CreatesNewParagraph": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File"
                                            }
                                        },
                                        "Clipboard_Paragraph_CtrlV_DoubleCRLF_CreatesNewParagraph.json": "File",
                                        "Clipboard_Paragraph_CtrlV_SingleCRLF_StaysInParagraph": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File"
                                            }
                                        },
                                        "Clipboard_Paragraph_CtrlV_SingleCRLF_StaysInParagraph.json": "File",
                                        "Clipboard_Paragraph_CtrlV_TripleCRLF_FollowsParserRule": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File"
                                            }
                                        },
                                        "Clipboard_Paragraph_CtrlV_TripleCRLF_FollowsParserRule.json": "File",
                                        "Deletion_BackspaceAtStart_NoChange": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File"
                                            }
                                        },
                                        "Deletion_BackspaceAtStart_NoChange.json": "File",
                                        "Deletion_Backspace_DeletesPreviousChar": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File"
                                            }
                                        },
                                        "Deletion_Backspace_DeletesPreviousChar.json": "File",
                                        "Deletion_Backspace_DeletesSelection": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File"
                                            }
                                        },
                                        "Deletion_Backspace_DeletesSelection.json": "File",
                                        "Deletion_DeleteAtEnd_NoChange": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File"
                                            }
                                        },
                                        "Deletion_DeleteAtEnd_NoChange.json": "File",
                                        "Deletion_Delete_DeletesNextChar": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File"
                                            }
                                        },
                                        "Deletion_Delete_DeletesNextChar.json": "File",
                                        "Deletion_Delete_DeletesSelection": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File"
                                            }
                                        },
                                        "Deletion_Delete_DeletesSelection.json": "File",
                                        "EnterCRLF_Paragraph_CtrlEnter_InsertsLineBreakInParagraph": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File"
                                            }
                                        },
                                        "EnterCRLF_Paragraph_CtrlEnter_InsertsLineBreakInParagraph.json": "File",
                                        "EnterCRLF_Paragraph_Enter_CreatesNewParagraph": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File"
                                            }
                                        },
                                        "EnterCRLF_Paragraph_Enter_CreatesNewParagraph.json": "File",
                                        "NavigationParagraph_CtrlHomeEnd_JumpsToDocumentEdges": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File"
                                            }
                                        },
                                        "NavigationParagraph_CtrlHomeEnd_JumpsToDocumentEdges.json": "File",
                                        "NavigationParagraph_End_Escalation_Line_Paragraph_Document": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File"
                                            }
                                        },
                                        "NavigationParagraph_End_Escalation_Line_Paragraph_Document.json": "File",
                                        "NavigationParagraph_Home_Escalation_Line_Paragraph_Document": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File"
                                            }
                                        },
                                        "NavigationParagraph_Home_Escalation_Line_Paragraph_Document.json": "File",
                                        "NavigationParagraph_LeftRight_Boundary_JumpsAcrossParagraphs": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File"
                                            }
                                        },
                                        "NavigationParagraph_LeftRight_Boundary_JumpsAcrossParagraphs.json": "File",
                                        "NavigationParagraph_PageUpPageDown_MovesVerticallyByViewport": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File",
                                                "frame_5.json": "File"
                                            }
                                        },
                                        "NavigationParagraph_PageUpPageDown_MovesVerticallyByViewport.json": "File",
                                        "NavigationParagraph_UpDown_MovesAcrossLinesAndParagraphs": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File"
                                            }
                                        },
                                        "NavigationParagraph_UpDown_MovesAcrossLinesAndParagraphs.json": "File",
                                        "Navigation_ArrowKeys_MoveCaret": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File"
                                            }
                                        },
                                        "Navigation_ArrowKeys_MoveCaret.json": "File",
                                        "Navigation_CtrlWithNavigation_DoesNotChangeBehavior": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File"
                                            }
                                        },
                                        "Navigation_CtrlWithNavigation_DoesNotChangeBehavior.json": "File",
                                        "Navigation_HomeEnd_MoveCaretToEdges": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File"
                                            }
                                        },
                                        "Navigation_HomeEnd_MoveCaretToEdges.json": "File",
                                        "Navigation_PageKeys_NoEffectInSingleline": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File"
                                            }
                                        },
                                        "Navigation_PageKeys_NoEffectInSingleline.json": "File",
                                        "Navigation_ShiftArrow_ExtendsSelection": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File"
                                            }
                                        },
                                        "Navigation_ShiftArrow_ExtendsSelection.json": "File",
                                        "Navigation_ShiftHomeEnd_SelectToEdges": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File"
                                            }
                                        },
                                        "Navigation_ShiftHomeEnd_SelectToEdges.json": "File",
                                        "Navigation_UpDown_NoEffectInSingleline": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File"
                                            }
                                        },
                                        "Navigation_UpDown_NoEffectInSingleline.json": "File",
                                        "Scaffold_SmokeTest": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File"
                                            }
                                        },
                                        "Scaffold_SmokeTest.json": "File",
                                        "Typing_TypeString_IgnoresWhenCtrlPressed": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File"
                                            }
                                        },
                                        "Typing_TypeString_IgnoresWhenCtrlPressed.json": "File",
                                        "Typing_TypeString_InsertsPlainText": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File"
                                            }
                                        },
                                        "Typing_TypeString_InsertsPlainText.json": "File",
                                        "Typing_TypeString_InsertsTab_WhenAcceptTabInput": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File"
                                            }
                                        },
                                        "Typing_TypeString_InsertsTab_WhenAcceptTabInput.json": "File",
                                        "Typing_TypeString_ReplacesSelection": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File"
                                            }
                                        },
                                        "Typing_TypeString_ReplacesSelection.json": "File",
                                        "UndoRedo_ClearUndoRedo_DeletesAllHistory": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File"
                                            }
                                        },
                                        "UndoRedo_ClearUndoRedo_DeletesAllHistory.json": "File",
                                        "UndoRedo_CtrlZ_UndoesDeletion": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File"
                                            }
                                        },
                                        "UndoRedo_CtrlZ_UndoesDeletion.json": "File",
                                        "UndoRedo_CtrlZ_UndoesTyping_AndCtrlY_Redoes": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File"
                                            }
                                        },
                                        "UndoRedo_CtrlZ_UndoesTyping_AndCtrlY_Redoes.json": "File",
                                        "UndoRedo_UndoRedo_ReachingHistoryEnds_ReturnsFalse_AndStateCorrect": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File"
                                            }
                                        },
                                        "UndoRedo_UndoRedo_ReachingHistoryEnds_ReturnsFalse_AndStateCorrect.json": "File"
                                    }
                                },
                                "Typing": {
                                    "type": "Folder",
                                    "content": {
                                        "frame_0.json": "File",
                                        "frame_1.json": "File",
                                        "frame_2.json": "File",
                                        "frame_3.json": "File",
                                        "frame_4.json": "File",
                                        "frame_5.json": "File",
                                        "frame_6.json": "File"
                                    }
                                },
                                "Typing.json": "File"
                            }
                        },
                        "GuiDocumentViewer": {
                            "type": "Folder",
                            "content": {
                                "Basic": {
                                    "type": "Folder",
                                    "content": {
                                        "frame_0.json": "File",
                                        "frame_1.json": "File",
                                        "frame_2.json": "File"
                                    }
                                },
                                "Basic.json": "File",
                                "Key": {
                                    "type": "Folder",
                                    "content": {
                                        "Clipboard_CtrlC_CopiesSelection_TextUnchanged": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File"
                                            }
                                        },
                                        "Clipboard_CtrlC_CopiesSelection_TextUnchanged.json": "File",
                                        "Clipboard_CtrlV_EmptyClipboard_NoChange": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File"
                                            }
                                        },
                                        "Clipboard_CtrlV_EmptyClipboard_NoChange.json": "File",
                                        "Clipboard_CtrlV_PastesAtCaret": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File"
                                            }
                                        },
                                        "Clipboard_CtrlV_PastesAtCaret.json": "File",
                                        "Clipboard_CtrlV_ReplacesSelection": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File"
                                            }
                                        },
                                        "Clipboard_CtrlV_ReplacesSelection.json": "File",
                                        "Clipboard_CtrlX_CutsSelection_TextUpdated": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File"
                                            }
                                        },
                                        "Clipboard_CtrlX_CutsSelection_TextUpdated.json": "File",
                                        "Clipboard_Paragraph_CtrlC_CtrlV_Roundtrip_PreservesParagraphAndLineBreakStructure": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File"
                                            }
                                        },
                                        "Clipboard_Paragraph_CtrlC_CtrlV_Roundtrip_PreservesParagraphAndLineBreakStructure.json": "File",
                                        "Clipboard_Paragraph_CtrlV_DoubleCRLF_CreatesNewParagraph": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File"
                                            }
                                        },
                                        "Clipboard_Paragraph_CtrlV_DoubleCRLF_CreatesNewParagraph.json": "File",
                                        "Clipboard_Paragraph_CtrlV_SingleCRLF_StaysInParagraph": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File"
                                            }
                                        },
                                        "Clipboard_Paragraph_CtrlV_SingleCRLF_StaysInParagraph.json": "File",
                                        "Clipboard_Paragraph_CtrlV_TripleCRLF_FollowsParserRule": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File"
                                            }
                                        },
                                        "Clipboard_Paragraph_CtrlV_TripleCRLF_FollowsParserRule.json": "File",
                                        "Deletion_BackspaceAtStart_NoChange": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File"
                                            }
                                        },
                                        "Deletion_BackspaceAtStart_NoChange.json": "File",
                                        "Deletion_Backspace_DeletesPreviousChar": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File"
                                            }
                                        },
                                        "Deletion_Backspace_DeletesPreviousChar.json": "File",
                                        "Deletion_Backspace_DeletesSelection": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File"
                                            }
                                        },
                                        "Deletion_Backspace_DeletesSelection.json": "File",
                                        "Deletion_DeleteAtEnd_NoChange": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File"
                                            }
                                        },
                                        "Deletion_DeleteAtEnd_NoChange.json": "File",
                                        "Deletion_Delete_DeletesNextChar": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File"
                                            }
                                        },
                                        "Deletion_Delete_DeletesNextChar.json": "File",
                                        "Deletion_Delete_DeletesSelection": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File"
                                            }
                                        },
                                        "Deletion_Delete_DeletesSelection.json": "File",
                                        "EnterCRLF_Paragraph_CtrlEnter_InsertsLineBreakInParagraph": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File"
                                            }
                                        },
                                        "EnterCRLF_Paragraph_CtrlEnter_InsertsLineBreakInParagraph.json": "File",
                                        "EnterCRLF_Paragraph_Enter_CreatesNewParagraph": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File"
                                            }
                                        },
                                        "EnterCRLF_Paragraph_Enter_CreatesNewParagraph.json": "File",
                                        "NavigationParagraph_CtrlHomeEnd_JumpsToDocumentEdges": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File"
                                            }
                                        },
                                        "NavigationParagraph_CtrlHomeEnd_JumpsToDocumentEdges.json": "File",
                                        "NavigationParagraph_End_Escalation_Line_Paragraph_Document": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File"
                                            }
                                        },
                                        "NavigationParagraph_End_Escalation_Line_Paragraph_Document.json": "File",
                                        "NavigationParagraph_Home_Escalation_Line_Paragraph_Document": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File"
                                            }
                                        },
                                        "NavigationParagraph_Home_Escalation_Line_Paragraph_Document.json": "File",
                                        "NavigationParagraph_LeftRight_Boundary_JumpsAcrossParagraphs": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File"
                                            }
                                        },
                                        "NavigationParagraph_LeftRight_Boundary_JumpsAcrossParagraphs.json": "File",
                                        "NavigationParagraph_PageUpPageDown_MovesVerticallyByViewport": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File",
                                                "frame_5.json": "File"
                                            }
                                        },
                                        "NavigationParagraph_PageUpPageDown_MovesVerticallyByViewport.json": "File",
                                        "NavigationParagraph_UpDown_MovesAcrossLinesAndParagraphs": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File"
                                            }
                                        },
                                        "NavigationParagraph_UpDown_MovesAcrossLinesAndParagraphs.json": "File",
                                        "Navigation_ArrowKeys_MoveCaret": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File"
                                            }
                                        },
                                        "Navigation_ArrowKeys_MoveCaret.json": "File",
                                        "Navigation_CtrlWithNavigation_DoesNotChangeBehavior": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File"
                                            }
                                        },
                                        "Navigation_CtrlWithNavigation_DoesNotChangeBehavior.json": "File",
                                        "Navigation_HomeEnd_MoveCaretToEdges": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File"
                                            }
                                        },
                                        "Navigation_HomeEnd_MoveCaretToEdges.json": "File",
                                        "Navigation_PageKeys_NoEffectInSingleline": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File"
                                            }
                                        },
                                        "Navigation_PageKeys_NoEffectInSingleline.json": "File",
                                        "Navigation_ShiftArrow_ExtendsSelection": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File"
                                            }
                                        },
                                        "Navigation_ShiftArrow_ExtendsSelection.json": "File",
                                        "Navigation_ShiftHomeEnd_SelectToEdges": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File"
                                            }
                                        },
                                        "Navigation_ShiftHomeEnd_SelectToEdges.json": "File",
                                        "Navigation_UpDown_NoEffectInSingleline": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File"
                                            }
                                        },
                                        "Navigation_UpDown_NoEffectInSingleline.json": "File",
                                        "Scaffold_SmokeTest": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File"
                                            }
                                        },
                                        "Scaffold_SmokeTest.json": "File",
                                        "Typing_TypeString_IgnoresWhenCtrlPressed": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File"
                                            }
                                        },
                                        "Typing_TypeString_IgnoresWhenCtrlPressed.json": "File",
                                        "Typing_TypeString_InsertsPlainText": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File"
                                            }
                                        },
                                        "Typing_TypeString_InsertsPlainText.json": "File",
                                        "Typing_TypeString_InsertsTab_WhenAcceptTabInput": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File"
                                            }
                                        },
                                        "Typing_TypeString_InsertsTab_WhenAcceptTabInput.json": "File",
                                        "Typing_TypeString_ReplacesSelection": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File"
                                            }
                                        },
                                        "Typing_TypeString_ReplacesSelection.json": "File",
                                        "UndoRedo_ClearUndoRedo_DeletesAllHistory": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File"
                                            }
                                        },
                                        "UndoRedo_ClearUndoRedo_DeletesAllHistory.json": "File",
                                        "UndoRedo_CtrlZ_UndoesDeletion": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File"
                                            }
                                        },
                                        "UndoRedo_CtrlZ_UndoesDeletion.json": "File",
                                        "UndoRedo_CtrlZ_UndoesTyping_AndCtrlY_Redoes": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File"
                                            }
                                        },
                                        "UndoRedo_CtrlZ_UndoesTyping_AndCtrlY_Redoes.json": "File",
                                        "UndoRedo_UndoRedo_ReachingHistoryEnds_ReturnsFalse_AndStateCorrect": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File"
                                            }
                                        },
                                        "UndoRedo_UndoRedo_ReachingHistoryEnds_ReturnsFalse_AndStateCorrect.json": "File"
                                    }
                                },
                                "Typing": {
                                    "type": "Folder",
                                    "content": {
                                        "frame_0.json": "File",
                                        "frame_1.json": "File",
                                        "frame_2.json": "File",
                                        "frame_3.json": "File",
                                        "frame_4.json": "File",
                                        "frame_5.json": "File",
                                        "frame_6.json": "File"
                                    }
                                },
                                "Typing.json": "File"
                            }
                        },
                        "GuiMultilineTextBox": {
                            "type": "Folder",
                            "content": {
                                "Basic": {
                                    "type": "Folder",
                                    "content": {
                                        "frame_0.json": "File",
                                        "frame_1.json": "File",
                                        "frame_2.json": "File"
                                    }
                                },
                                "Basic.json": "File",
                                "Key": {
                                    "type": "Folder",
                                    "content": {
                                        "Clipboard_CtrlC_CopiesSelection_TextUnchanged": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File"
                                            }
                                        },
                                        "Clipboard_CtrlC_CopiesSelection_TextUnchanged.json": "File",
                                        "Clipboard_CtrlC_CtrlV_Roundtrip_MultipleLines": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File"
                                            }
                                        },
                                        "Clipboard_CtrlC_CtrlV_Roundtrip_MultipleLines.json": "File",
                                        "Clipboard_CtrlV_EmptyClipboard_NoChange": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File"
                                            }
                                        },
                                        "Clipboard_CtrlV_EmptyClipboard_NoChange.json": "File",
                                        "Clipboard_CtrlV_PastesAtCaret": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File"
                                            }
                                        },
                                        "Clipboard_CtrlV_PastesAtCaret.json": "File",
                                        "Clipboard_CtrlV_PreservesMultipleLines": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File"
                                            }
                                        },
                                        "Clipboard_CtrlV_PreservesMultipleLines.json": "File",
                                        "Clipboard_CtrlV_ReplacesSelection": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File"
                                            }
                                        },
                                        "Clipboard_CtrlV_ReplacesSelection.json": "File",
                                        "Clipboard_CtrlX_CutsSelection_TextUpdated": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File"
                                            }
                                        },
                                        "Clipboard_CtrlX_CutsSelection_TextUpdated.json": "File",
                                        "Deletion_BackspaceAtStart_NoChange": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File"
                                            }
                                        },
                                        "Deletion_BackspaceAtStart_NoChange.json": "File",
                                        "Deletion_Backspace_DeletesPreviousChar": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File"
                                            }
                                        },
                                        "Deletion_Backspace_DeletesPreviousChar.json": "File",
                                        "Deletion_Backspace_DeletesSelection": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File"
                                            }
                                        },
                                        "Deletion_Backspace_DeletesSelection.json": "File",
                                        "Deletion_DeleteAtEnd_NoChange": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File"
                                            }
                                        },
                                        "Deletion_DeleteAtEnd_NoChange.json": "File",
                                        "Deletion_Delete_DeletesNextChar": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File"
                                            }
                                        },
                                        "Deletion_Delete_DeletesNextChar.json": "File",
                                        "Deletion_Delete_DeletesSelection": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File"
                                            }
                                        },
                                        "Deletion_Delete_DeletesSelection.json": "File",
                                        "EnterCRLF_CtrlEnter_BehavesSameAsEnter": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File"
                                            }
                                        },
                                        "EnterCRLF_CtrlEnter_BehavesSameAsEnter.json": "File",
                                        "EnterCRLF_Enter_SplitsIntoTwoLines": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File"
                                            }
                                        },
                                        "EnterCRLF_Enter_SplitsIntoTwoLines.json": "File",
                                        "NavigationMultiline_CtrlHomeEnd_JumpsToDocumentEdges": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File"
                                            }
                                        },
                                        "NavigationMultiline_CtrlHomeEnd_JumpsToDocumentEdges.json": "File",
                                        "NavigationMultiline_HomeEnd_Escalation_Line_Paragraph_Document": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File",
                                                "frame_5.json": "File"
                                            }
                                        },
                                        "NavigationMultiline_HomeEnd_Escalation_Line_Paragraph_Document.json": "File",
                                        "NavigationMultiline_LeftRight_Boundary_JumpsAcrossLines": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File"
                                            }
                                        },
                                        "NavigationMultiline_LeftRight_Boundary_JumpsAcrossLines.json": "File",
                                        "NavigationMultiline_PageUpPageDown_MovesVerticallyByViewport": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File",
                                                "frame_5.json": "File"
                                            }
                                        },
                                        "NavigationMultiline_PageUpPageDown_MovesVerticallyByViewport.json": "File",
                                        "NavigationMultiline_UpDown_MovesAcrossLines": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File"
                                            }
                                        },
                                        "NavigationMultiline_UpDown_MovesAcrossLines.json": "File",
                                        "Navigation_ArrowKeys_MoveCaret": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File"
                                            }
                                        },
                                        "Navigation_ArrowKeys_MoveCaret.json": "File",
                                        "Navigation_CtrlWithNavigation_DoesNotChangeBehavior": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File"
                                            }
                                        },
                                        "Navigation_CtrlWithNavigation_DoesNotChangeBehavior.json": "File",
                                        "Navigation_HomeEnd_MoveCaretToEdges": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File"
                                            }
                                        },
                                        "Navigation_HomeEnd_MoveCaretToEdges.json": "File",
                                        "Navigation_PageKeys_NoEffectInSingleline": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File"
                                            }
                                        },
                                        "Navigation_PageKeys_NoEffectInSingleline.json": "File",
                                        "Navigation_ShiftArrow_ExtendsSelection": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File"
                                            }
                                        },
                                        "Navigation_ShiftArrow_ExtendsSelection.json": "File",
                                        "Navigation_ShiftHomeEnd_SelectToEdges": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File"
                                            }
                                        },
                                        "Navigation_ShiftHomeEnd_SelectToEdges.json": "File",
                                        "Navigation_UpDown_NoEffectInSingleline": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File"
                                            }
                                        },
                                        "Navigation_UpDown_NoEffectInSingleline.json": "File",
                                        "Scaffold_SmokeTest": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File"
                                            }
                                        },
                                        "Scaffold_SmokeTest.json": "File",
                                        "Typing_TypeString_IgnoresWhenCtrlPressed": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File"
                                            }
                                        },
                                        "Typing_TypeString_IgnoresWhenCtrlPressed.json": "File",
                                        "Typing_TypeString_InsertsPlainText": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File"
                                            }
                                        },
                                        "Typing_TypeString_InsertsPlainText.json": "File",
                                        "Typing_TypeString_InsertsTab_WhenAcceptTabInput": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File"
                                            }
                                        },
                                        "Typing_TypeString_InsertsTab_WhenAcceptTabInput.json": "File",
                                        "Typing_TypeString_ReplacesSelection": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File"
                                            }
                                        },
                                        "Typing_TypeString_ReplacesSelection.json": "File",
                                        "UndoRedo_ClearUndoRedo_DeletesAllHistory": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File"
                                            }
                                        },
                                        "UndoRedo_ClearUndoRedo_DeletesAllHistory.json": "File",
                                        "UndoRedo_CtrlZ_UndoesDeletion": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File"
                                            }
                                        },
                                        "UndoRedo_CtrlZ_UndoesDeletion.json": "File",
                                        "UndoRedo_CtrlZ_UndoesTyping_AndCtrlY_Redoes": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File"
                                            }
                                        },
                                        "UndoRedo_CtrlZ_UndoesTyping_AndCtrlY_Redoes.json": "File",
                                        "UndoRedo_UndoRedo_ReachingHistoryEnds_ReturnsFalse_AndStateCorrect": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File"
                                            }
                                        },
                                        "UndoRedo_UndoRedo_ReachingHistoryEnds_ReturnsFalse_AndStateCorrect.json": "File"
                                    }
                                },
                                "Typing": {
                                    "type": "Folder",
                                    "content": {
                                        "frame_0.json": "File",
                                        "frame_1.json": "File",
                                        "frame_2.json": "File",
                                        "frame_3.json": "File",
                                        "frame_4.json": "File",
                                        "frame_5.json": "File",
                                        "frame_6.json": "File"
                                    }
                                },
                                "Typing.json": "File"
                            }
                        },
                        "GuiSinglelineTextBox": {
                            "type": "Folder",
                            "content": {
                                "Basic": {
                                    "type": "Folder",
                                    "content": {
                                        "frame_0.json": "File",
                                        "frame_1.json": "File",
                                        "frame_2.json": "File"
                                    }
                                },
                                "Basic.json": "File",
                                "Key": {
                                    "type": "Folder",
                                    "content": {
                                        "Clipboard_CtrlC_CopiesSelection_TextUnchanged": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File"
                                            }
                                        },
                                        "Clipboard_CtrlC_CopiesSelection_TextUnchanged.json": "File",
                                        "Clipboard_CtrlV_EmptyClipboard_NoChange": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File"
                                            }
                                        },
                                        "Clipboard_CtrlV_EmptyClipboard_NoChange.json": "File",
                                        "Clipboard_CtrlV_FlattensLineBreaks": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File"
                                            }
                                        },
                                        "Clipboard_CtrlV_FlattensLineBreaks.json": "File",
                                        "Clipboard_CtrlV_PastesAtCaret": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File"
                                            }
                                        },
                                        "Clipboard_CtrlV_PastesAtCaret.json": "File",
                                        "Clipboard_CtrlV_ReplacesSelection": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File"
                                            }
                                        },
                                        "Clipboard_CtrlV_ReplacesSelection.json": "File",
                                        "Clipboard_CtrlX_CutsSelection_TextUpdated": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File"
                                            }
                                        },
                                        "Clipboard_CtrlX_CutsSelection_TextUpdated.json": "File",
                                        "Deletion_BackspaceAtStart_NoChange": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File"
                                            }
                                        },
                                        "Deletion_BackspaceAtStart_NoChange.json": "File",
                                        "Deletion_Backspace_DeletesPreviousChar": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File"
                                            }
                                        },
                                        "Deletion_Backspace_DeletesPreviousChar.json": "File",
                                        "Deletion_Backspace_DeletesSelection": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File"
                                            }
                                        },
                                        "Deletion_Backspace_DeletesSelection.json": "File",
                                        "Deletion_CtrlEnter_Ignored_NoSelection_NoChange": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File"
                                            }
                                        },
                                        "Deletion_CtrlEnter_Ignored_NoSelection_NoChange.json": "File",
                                        "Deletion_CtrlEnter_Ignored_SelectionPreserved": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File"
                                            }
                                        },
                                        "Deletion_CtrlEnter_Ignored_SelectionPreserved.json": "File",
                                        "Deletion_DeleteAtEnd_NoChange": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File"
                                            }
                                        },
                                        "Deletion_DeleteAtEnd_NoChange.json": "File",
                                        "Deletion_Delete_DeletesNextChar": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File"
                                            }
                                        },
                                        "Deletion_Delete_DeletesNextChar.json": "File",
                                        "Deletion_Delete_DeletesSelection": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File"
                                            }
                                        },
                                        "Deletion_Delete_DeletesSelection.json": "File",
                                        "Deletion_Enter_Ignored_NoSelection_NoChange": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File"
                                            }
                                        },
                                        "Deletion_Enter_Ignored_NoSelection_NoChange.json": "File",
                                        "Deletion_Enter_Ignored_SelectionPreserved": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File"
                                            }
                                        },
                                        "Deletion_Enter_Ignored_SelectionPreserved.json": "File",
                                        "Navigation_ArrowKeys_MoveCaret": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File"
                                            }
                                        },
                                        "Navigation_ArrowKeys_MoveCaret.json": "File",
                                        "Navigation_CtrlWithNavigation_DoesNotChangeBehavior": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File"
                                            }
                                        },
                                        "Navigation_CtrlWithNavigation_DoesNotChangeBehavior.json": "File",
                                        "Navigation_HomeEnd_MoveCaretToEdges": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File"
                                            }
                                        },
                                        "Navigation_HomeEnd_MoveCaretToEdges.json": "File",
                                        "Navigation_PageKeys_NoEffectInSingleline": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File"
                                            }
                                        },
                                        "Navigation_PageKeys_NoEffectInSingleline.json": "File",
                                        "Navigation_ShiftArrow_ExtendsSelection": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File"
                                            }
                                        },
                                        "Navigation_ShiftArrow_ExtendsSelection.json": "File",
                                        "Navigation_ShiftHomeEnd_SelectToEdges": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File"
                                            }
                                        },
                                        "Navigation_ShiftHomeEnd_SelectToEdges.json": "File",
                                        "Navigation_UpDown_NoEffectInSingleline": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File"
                                            }
                                        },
                                        "Navigation_UpDown_NoEffectInSingleline.json": "File",
                                        "Scaffold_SmokeTest": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File"
                                            }
                                        },
                                        "Scaffold_SmokeTest.json": "File",
                                        "Typing_TypeString_IgnoresWhenCtrlPressed": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File"
                                            }
                                        },
                                        "Typing_TypeString_IgnoresWhenCtrlPressed.json": "File",
                                        "Typing_TypeString_InsertsPlainText": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File"
                                            }
                                        },
                                        "Typing_TypeString_InsertsPlainText.json": "File",
                                        "Typing_TypeString_InsertsTab_WhenAcceptTabInput": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File"
                                            }
                                        },
                                        "Typing_TypeString_InsertsTab_WhenAcceptTabInput.json": "File",
                                        "Typing_TypeString_ReplacesSelection": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File"
                                            }
                                        },
                                        "Typing_TypeString_ReplacesSelection.json": "File",
                                        "UndoRedo_ClearUndoRedo_DeletesAllHistory": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File"
                                            }
                                        },
                                        "UndoRedo_ClearUndoRedo_DeletesAllHistory.json": "File",
                                        "UndoRedo_CtrlZ_UndoesDeletion": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File"
                                            }
                                        },
                                        "UndoRedo_CtrlZ_UndoesDeletion.json": "File",
                                        "UndoRedo_CtrlZ_UndoesPaste_FlattenedText": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File"
                                            }
                                        },
                                        "UndoRedo_CtrlZ_UndoesPaste_FlattenedText.json": "File",
                                        "UndoRedo_CtrlZ_UndoesTyping_AndCtrlY_Redoes": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File"
                                            }
                                        },
                                        "UndoRedo_CtrlZ_UndoesTyping_AndCtrlY_Redoes.json": "File",
                                        "UndoRedo_UndoRedo_ReachingHistoryEnds_ReturnsFalse_AndStateCorrect": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File"
                                            }
                                        },
                                        "UndoRedo_UndoRedo_ReachingHistoryEnds_ReturnsFalse_AndStateCorrect.json": "File"
                                    }
                                },
                                "PasswordChar": {
                                    "type": "Folder",
                                    "content": {
                                        "frame_0.json": "File",
                                        "frame_1.json": "File",
                                        "frame_2.json": "File",
                                        "frame_3.json": "File",
                                        "frame_4.json": "File"
                                    }
                                },
                                "PasswordChar.json": "File",
                                "Typing": {
                                    "type": "Folder",
                                    "content": {
                                        "frame_0.json": "File",
                                        "frame_1.json": "File",
                                        "frame_2.json": "File",
                                        "frame_3.json": "File",
                                        "frame_4.json": "File",
                                        "frame_5.json": "File",
                                        "frame_6.json": "File"
                                    }
                                },
                                "Typing.json": "File"
                            }
                        },
                        "Regressions": {
                            "type": "Folder",
                            "content": {
                                "UnexpectedlySharedFonts": {
                                    "type": "Folder",
                                    "content": {
                                        "frame_0.json": "File",
                                        "frame_1.json": "File",
                                        "frame_2.json": "File"
                                    }
                                },
                                "UnexpectedlySharedFonts.json": "File"
                            }
                        }
                    }
                },
                "List": {
                    "type": "Folder",
                    "content": {
                        "GuiBindableDataGrid": {
                            "type": "Folder",
                            "content": {
                                "AsListView": {
                                    "type": "Folder",
                                    "content": {
                                        "BigIcon": {
                                            "type": "Folder",
                                            "content": {
                                                "MakeInvisibleItems": {
                                                    "type": "Folder",
                                                    "content": {
                                                        "frame_0.json": "File",
                                                        "frame_1.json": "File",
                                                        "frame_10.json": "File",
                                                        "frame_11.json": "File",
                                                        "frame_2.json": "File",
                                                        "frame_3.json": "File",
                                                        "frame_4.json": "File",
                                                        "frame_5.json": "File",
                                                        "frame_6.json": "File",
                                                        "frame_7.json": "File",
                                                        "frame_8.json": "File",
                                                        "frame_9.json": "File"
                                                    }
                                                },
                                                "MakeInvisibleItems.json": "File",
                                                "MakeVisibleItems": {
                                                    "type": "Folder",
                                                    "content": {
                                                        "frame_0.json": "File",
                                                        "frame_1.json": "File",
                                                        "frame_2.json": "File",
                                                        "frame_3.json": "File",
                                                        "frame_4.json": "File",
                                                        "frame_5.json": "File",
                                                        "frame_6.json": "File",
                                                        "frame_7.json": "File"
                                                    }
                                                },
                                                "MakeVisibleItems.json": "File",
                                                "NavigateByClickAndKey": {
                                                    "type": "Folder",
                                                    "content": {
                                                        "frame_0.json": "File",
                                                        "frame_1.json": "File",
                                                        "frame_2.json": "File",
                                                        "frame_3.json": "File",
                                                        "frame_4.json": "File",
                                                        "frame_5.json": "File",
                                                        "frame_6.json": "File",
                                                        "frame_7.json": "File",
                                                        "frame_8.json": "File"
                                                    }
                                                },
                                                "NavigateByClickAndKey.json": "File",
                                                "UpdateInvisibleItems": {
                                                    "type": "Folder",
                                                    "content": {
                                                        "frame_0.json": "File",
                                                        "frame_1.json": "File",
                                                        "frame_2.json": "File",
                                                        "frame_3.json": "File",
                                                        "frame_4.json": "File"
                                                    }
                                                },
                                                "UpdateInvisibleItems.json": "File",
                                                "UpdateVisibleItems": {
                                                    "type": "Folder",
                                                    "content": {
                                                        "frame_0.json": "File",
                                                        "frame_1.json": "File",
                                                        "frame_2.json": "File",
                                                        "frame_3.json": "File",
                                                        "frame_4.json": "File"
                                                    }
                                                },
                                                "UpdateVisibleItems.json": "File"
                                            }
                                        },
                                        "Detail": {
                                            "type": "Folder",
                                            "content": {
                                                "MakeInvisibleItems": {
                                                    "type": "Folder",
                                                    "content": {
                                                        "frame_0.json": "File",
                                                        "frame_1.json": "File",
                                                        "frame_10.json": "File",
                                                        "frame_11.json": "File",
                                                        "frame_2.json": "File",
                                                        "frame_3.json": "File",
                                                        "frame_4.json": "File",
                                                        "frame_5.json": "File",
                                                        "frame_6.json": "File",
                                                        "frame_7.json": "File",
                                                        "frame_8.json": "File",
                                                        "frame_9.json": "File"
                                                    }
                                                },
                                                "MakeInvisibleItems.json": "File",
                                                "MakeVisibleItems": {
                                                    "type": "Folder",
                                                    "content": {
                                                        "frame_0.json": "File",
                                                        "frame_1.json": "File",
                                                        "frame_2.json": "File",
                                                        "frame_3.json": "File",
                                                        "frame_4.json": "File",
                                                        "frame_5.json": "File",
                                                        "frame_6.json": "File",
                                                        "frame_7.json": "File"
                                                    }
                                                },
                                                "MakeVisibleItems.json": "File",
                                                "NavigateByClickAndKey": {
                                                    "type": "Folder",
                                                    "content": {
                                                        "frame_0.json": "File",
                                                        "frame_1.json": "File",
                                                        "frame_2.json": "File",
                                                        "frame_3.json": "File",
                                                        "frame_4.json": "File",
                                                        "frame_5.json": "File",
                                                        "frame_6.json": "File"
                                                    }
                                                },
                                                "NavigateByClickAndKey.json": "File",
                                                "UpdateInvisibleItems": {
                                                    "type": "Folder",
                                                    "content": {
                                                        "frame_0.json": "File",
                                                        "frame_1.json": "File",
                                                        "frame_2.json": "File",
                                                        "frame_3.json": "File",
                                                        "frame_4.json": "File"
                                                    }
                                                },
                                                "UpdateInvisibleItems.json": "File",
                                                "UpdateVisibleItems": {
                                                    "type": "Folder",
                                                    "content": {
                                                        "frame_0.json": "File",
                                                        "frame_1.json": "File",
                                                        "frame_2.json": "File",
                                                        "frame_3.json": "File",
                                                        "frame_4.json": "File",
                                                        "frame_5.json": "File"
                                                    }
                                                },
                                                "UpdateVisibleItems.json": "File"
                                            }
                                        },
                                        "Information": {
                                            "type": "Folder",
                                            "content": {
                                                "MakeInvisibleItems": {
                                                    "type": "Folder",
                                                    "content": {
                                                        "frame_0.json": "File",
                                                        "frame_1.json": "File",
                                                        "frame_10.json": "File",
                                                        "frame_11.json": "File",
                                                        "frame_2.json": "File",
                                                        "frame_3.json": "File",
                                                        "frame_4.json": "File",
                                                        "frame_5.json": "File",
                                                        "frame_6.json": "File",
                                                        "frame_7.json": "File",
                                                        "frame_8.json": "File",
                                                        "frame_9.json": "File"
                                                    }
                                                },
                                                "MakeInvisibleItems.json": "File",
                                                "MakeVisibleItems": {
                                                    "type": "Folder",
                                                    "content": {
                                                        "frame_0.json": "File",
                                                        "frame_1.json": "File",
                                                        "frame_2.json": "File",
                                                        "frame_3.json": "File",
                                                        "frame_4.json": "File",
                                                        "frame_5.json": "File",
                                                        "frame_6.json": "File",
                                                        "frame_7.json": "File"
                                                    }
                                                },
                                                "MakeVisibleItems.json": "File",
                                                "NavigateByClickAndKey": {
                                                    "type": "Folder",
                                                    "content": {
                                                        "frame_0.json": "File",
                                                        "frame_1.json": "File",
                                                        "frame_2.json": "File",
                                                        "frame_3.json": "File",
                                                        "frame_4.json": "File",
                                                        "frame_5.json": "File",
                                                        "frame_6.json": "File"
                                                    }
                                                },
                                                "NavigateByClickAndKey.json": "File",
                                                "UpdateInvisibleItems": {
                                                    "type": "Folder",
                                                    "content": {
                                                        "frame_0.json": "File",
                                                        "frame_1.json": "File",
                                                        "frame_2.json": "File",
                                                        "frame_3.json": "File",
                                                        "frame_4.json": "File"
                                                    }
                                                },
                                                "UpdateInvisibleItems.json": "File",
                                                "UpdateVisibleItems": {
                                                    "type": "Folder",
                                                    "content": {
                                                        "frame_0.json": "File",
                                                        "frame_1.json": "File",
                                                        "frame_2.json": "File",
                                                        "frame_3.json": "File",
                                                        "frame_4.json": "File",
                                                        "frame_5.json": "File"
                                                    }
                                                },
                                                "UpdateVisibleItems.json": "File"
                                            }
                                        },
                                        "List": {
                                            "type": "Folder",
                                            "content": {
                                                "MakeInvisibleItems": {
                                                    "type": "Folder",
                                                    "content": {
                                                        "frame_0.json": "File",
                                                        "frame_1.json": "File",
                                                        "frame_10.json": "File",
                                                        "frame_11.json": "File",
                                                        "frame_2.json": "File",
                                                        "frame_3.json": "File",
                                                        "frame_4.json": "File",
                                                        "frame_5.json": "File",
                                                        "frame_6.json": "File",
                                                        "frame_7.json": "File",
                                                        "frame_8.json": "File",
                                                        "frame_9.json": "File"
                                                    }
                                                },
                                                "MakeInvisibleItems.json": "File",
                                                "MakeVisibleItems": {
                                                    "type": "Folder",
                                                    "content": {
                                                        "frame_0.json": "File",
                                                        "frame_1.json": "File",
                                                        "frame_2.json": "File",
                                                        "frame_3.json": "File",
                                                        "frame_4.json": "File",
                                                        "frame_5.json": "File",
                                                        "frame_6.json": "File",
                                                        "frame_7.json": "File"
                                                    }
                                                },
                                                "MakeVisibleItems.json": "File",
                                                "NavigateByClickAndKey": {
                                                    "type": "Folder",
                                                    "content": {
                                                        "frame_0.json": "File",
                                                        "frame_1.json": "File",
                                                        "frame_2.json": "File",
                                                        "frame_3.json": "File",
                                                        "frame_4.json": "File",
                                                        "frame_5.json": "File",
                                                        "frame_6.json": "File",
                                                        "frame_7.json": "File",
                                                        "frame_8.json": "File"
                                                    }
                                                },
                                                "NavigateByClickAndKey.json": "File",
                                                "UpdateInvisibleItems": {
                                                    "type": "Folder",
                                                    "content": {
                                                        "frame_0.json": "File",
                                                        "frame_1.json": "File",
                                                        "frame_2.json": "File",
                                                        "frame_3.json": "File",
                                                        "frame_4.json": "File"
                                                    }
                                                },
                                                "UpdateInvisibleItems.json": "File",
                                                "UpdateVisibleItems": {
                                                    "type": "Folder",
                                                    "content": {
                                                        "frame_0.json": "File",
                                                        "frame_1.json": "File",
                                                        "frame_2.json": "File",
                                                        "frame_3.json": "File",
                                                        "frame_4.json": "File"
                                                    }
                                                },
                                                "UpdateVisibleItems.json": "File"
                                            }
                                        },
                                        "PropertyBinding": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File"
                                            }
                                        },
                                        "PropertyBinding.json": "File",
                                        "SmallIcon": {
                                            "type": "Folder",
                                            "content": {
                                                "MakeInvisibleItems": {
                                                    "type": "Folder",
                                                    "content": {
                                                        "frame_0.json": "File",
                                                        "frame_1.json": "File",
                                                        "frame_10.json": "File",
                                                        "frame_11.json": "File",
                                                        "frame_2.json": "File",
                                                        "frame_3.json": "File",
                                                        "frame_4.json": "File",
                                                        "frame_5.json": "File",
                                                        "frame_6.json": "File",
                                                        "frame_7.json": "File",
                                                        "frame_8.json": "File",
                                                        "frame_9.json": "File"
                                                    }
                                                },
                                                "MakeInvisibleItems.json": "File",
                                                "MakeVisibleItems": {
                                                    "type": "Folder",
                                                    "content": {
                                                        "frame_0.json": "File",
                                                        "frame_1.json": "File",
                                                        "frame_2.json": "File",
                                                        "frame_3.json": "File",
                                                        "frame_4.json": "File",
                                                        "frame_5.json": "File",
                                                        "frame_6.json": "File",
                                                        "frame_7.json": "File"
                                                    }
                                                },
                                                "MakeVisibleItems.json": "File",
                                                "NavigateByClickAndKey": {
                                                    "type": "Folder",
                                                    "content": {
                                                        "frame_0.json": "File",
                                                        "frame_1.json": "File",
                                                        "frame_2.json": "File",
                                                        "frame_3.json": "File",
                                                        "frame_4.json": "File",
                                                        "frame_5.json": "File",
                                                        "frame_6.json": "File",
                                                        "frame_7.json": "File",
                                                        "frame_8.json": "File"
                                                    }
                                                },
                                                "NavigateByClickAndKey.json": "File",
                                                "UpdateInvisibleItems": {
                                                    "type": "Folder",
                                                    "content": {
                                                        "frame_0.json": "File",
                                                        "frame_1.json": "File",
                                                        "frame_2.json": "File",
                                                        "frame_3.json": "File",
                                                        "frame_4.json": "File"
                                                    }
                                                },
                                                "UpdateInvisibleItems.json": "File",
                                                "UpdateVisibleItems": {
                                                    "type": "Folder",
                                                    "content": {
                                                        "frame_0.json": "File",
                                                        "frame_1.json": "File",
                                                        "frame_2.json": "File",
                                                        "frame_3.json": "File",
                                                        "frame_4.json": "File"
                                                    }
                                                },
                                                "UpdateVisibleItems.json": "File"
                                            }
                                        },
                                        "SwitchViews": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File",
                                                "frame_5.json": "File",
                                                "frame_6.json": "File",
                                                "frame_7.json": "File"
                                            }
                                        },
                                        "SwitchViews.json": "File",
                                        "Tile": {
                                            "type": "Folder",
                                            "content": {
                                                "MakeInvisibleItems": {
                                                    "type": "Folder",
                                                    "content": {
                                                        "frame_0.json": "File",
                                                        "frame_1.json": "File",
                                                        "frame_10.json": "File",
                                                        "frame_11.json": "File",
                                                        "frame_2.json": "File",
                                                        "frame_3.json": "File",
                                                        "frame_4.json": "File",
                                                        "frame_5.json": "File",
                                                        "frame_6.json": "File",
                                                        "frame_7.json": "File",
                                                        "frame_8.json": "File",
                                                        "frame_9.json": "File"
                                                    }
                                                },
                                                "MakeInvisibleItems.json": "File",
                                                "MakeVisibleItems": {
                                                    "type": "Folder",
                                                    "content": {
                                                        "frame_0.json": "File",
                                                        "frame_1.json": "File",
                                                        "frame_2.json": "File",
                                                        "frame_3.json": "File",
                                                        "frame_4.json": "File",
                                                        "frame_5.json": "File",
                                                        "frame_6.json": "File",
                                                        "frame_7.json": "File"
                                                    }
                                                },
                                                "MakeVisibleItems.json": "File",
                                                "NavigateByClickAndKey": {
                                                    "type": "Folder",
                                                    "content": {
                                                        "frame_0.json": "File",
                                                        "frame_1.json": "File",
                                                        "frame_2.json": "File",
                                                        "frame_3.json": "File",
                                                        "frame_4.json": "File",
                                                        "frame_5.json": "File",
                                                        "frame_6.json": "File",
                                                        "frame_7.json": "File",
                                                        "frame_8.json": "File"
                                                    }
                                                },
                                                "NavigateByClickAndKey.json": "File",
                                                "UpdateInvisibleItems": {
                                                    "type": "Folder",
                                                    "content": {
                                                        "frame_0.json": "File",
                                                        "frame_1.json": "File",
                                                        "frame_2.json": "File",
                                                        "frame_3.json": "File",
                                                        "frame_4.json": "File"
                                                    }
                                                },
                                                "UpdateInvisibleItems.json": "File",
                                                "UpdateVisibleItems": {
                                                    "type": "Folder",
                                                    "content": {
                                                        "frame_0.json": "File",
                                                        "frame_1.json": "File",
                                                        "frame_2.json": "File",
                                                        "frame_3.json": "File",
                                                        "frame_4.json": "File",
                                                        "frame_5.json": "File"
                                                    }
                                                },
                                                "UpdateVisibleItems.json": "File"
                                            }
                                        }
                                    }
                                },
                                "Binding": {
                                    "type": "Folder",
                                    "content": {
                                        "DisplayEmumProperties": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File"
                                            }
                                        },
                                        "DisplayEmumProperties.json": "File",
                                        "DisplayMixedProperties": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File"
                                            }
                                        },
                                        "DisplayMixedProperties.json": "File",
                                        "DisplayStringProperties": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File"
                                            }
                                        },
                                        "DisplayStringProperties.json": "File",
                                        "PropertyBinding": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File"
                                            }
                                        },
                                        "PropertyBinding.json": "File"
                                    }
                                },
                                "CellEditor": {
                                    "type": "Folder",
                                    "content": {
                                        "ComboEditor": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File",
                                                "frame_5.json": "File",
                                                "frame_6.json": "File"
                                            }
                                        },
                                        "ComboEditor.json": "File",
                                        "ComboEditorWithSorterAndFilter": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File",
                                                "frame_5.json": "File",
                                                "frame_6.json": "File"
                                            }
                                        },
                                        "ComboEditorWithSorterAndFilter.json": "File",
                                        "ComboEditorWithSorterAndFilter2": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File",
                                                "frame_5.json": "File",
                                                "frame_6.json": "File"
                                            }
                                        },
                                        "ComboEditorWithSorterAndFilter2.json": "File"
                                    }
                                },
                                "CellVisualizer": {
                                    "type": "Folder",
                                    "content": {
                                        "ClickHyperlink": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File"
                                            }
                                        },
                                        "ClickHyperlink.json": "File",
                                        "SorterAndFilter": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File"
                                            }
                                        },
                                        "SorterAndFilter.json": "File"
                                    }
                                },
                                "ColumnApi": {
                                    "type": "Folder",
                                    "content": {
                                        "ChangeDataSource": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File",
                                                "frame_5.json": "File",
                                                "frame_6.json": "File",
                                                "frame_7.json": "File"
                                            }
                                        },
                                        "ChangeDataSource.json": "File",
                                        "FilterByColumn": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File",
                                                "frame_5.json": "File",
                                                "frame_6.json": "File"
                                            }
                                        },
                                        "FilterByColumn.json": "File",
                                        "ReplaceDataSource": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File",
                                                "frame_5.json": "File",
                                                "frame_6.json": "File",
                                                "frame_7.json": "File"
                                            }
                                        },
                                        "ReplaceDataSource.json": "File",
                                        "SortByColumn": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_10.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File",
                                                "frame_5.json": "File",
                                                "frame_6.json": "File",
                                                "frame_7.json": "File",
                                                "frame_8.json": "File",
                                                "frame_9.json": "File"
                                            }
                                        },
                                        "SortByColumn.json": "File",
                                        "SorterAndFilter": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File"
                                            }
                                        },
                                        "SorterAndFilter.json": "File"
                                    }
                                },
                                "ColumnUI": {
                                    "type": "Folder",
                                    "content": {
                                        "FilterByColumn": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_10.json": "File",
                                                "frame_11.json": "File",
                                                "frame_12.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File",
                                                "frame_5.json": "File",
                                                "frame_6.json": "File",
                                                "frame_7.json": "File",
                                                "frame_8.json": "File",
                                                "frame_9.json": "File"
                                            }
                                        },
                                        "FilterByColumn.json": "File",
                                        "SortByColumn": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File",
                                                "frame_5.json": "File",
                                                "frame_6.json": "File",
                                                "frame_7.json": "File"
                                            }
                                        },
                                        "SortByColumn.json": "File"
                                    }
                                },
                                "Properties": {
                                    "type": "Folder",
                                    "content": {
                                        "SelectCell": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File",
                                                "frame_5.json": "File"
                                            }
                                        },
                                        "SelectCell.json": "File",
                                        "SelectCellByClick": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File",
                                                "frame_5.json": "File"
                                            }
                                        },
                                        "SelectCellByClick.json": "File",
                                        "SelectCellByKey": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File",
                                                "frame_5.json": "File"
                                            }
                                        },
                                        "SelectCellByKey.json": "File",
                                        "SelectCellOpenEditor": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File",
                                                "frame_5.json": "File"
                                            }
                                        },
                                        "SelectCellOpenEditor.json": "File"
                                    }
                                }
                            }
                        },
                        "GuiBindableListView": {
                            "type": "Folder",
                            "content": {
                                "BigIcon": {
                                    "type": "Folder",
                                    "content": {
                                        "MakeInvisibleItems": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_10.json": "File",
                                                "frame_11.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File",
                                                "frame_5.json": "File",
                                                "frame_6.json": "File",
                                                "frame_7.json": "File",
                                                "frame_8.json": "File",
                                                "frame_9.json": "File"
                                            }
                                        },
                                        "MakeInvisibleItems.json": "File",
                                        "MakeVisibleItems": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File",
                                                "frame_5.json": "File",
                                                "frame_6.json": "File",
                                                "frame_7.json": "File"
                                            }
                                        },
                                        "MakeVisibleItems.json": "File",
                                        "NavigateByClickAndKey": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File",
                                                "frame_5.json": "File",
                                                "frame_6.json": "File",
                                                "frame_7.json": "File",
                                                "frame_8.json": "File"
                                            }
                                        },
                                        "NavigateByClickAndKey.json": "File",
                                        "UpdateInvisibleItems": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File"
                                            }
                                        },
                                        "UpdateInvisibleItems.json": "File",
                                        "UpdateVisibleItems": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File"
                                            }
                                        },
                                        "UpdateVisibleItems.json": "File"
                                    }
                                },
                                "Detail": {
                                    "type": "Folder",
                                    "content": {
                                        "MakeInvisibleItems": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_10.json": "File",
                                                "frame_11.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File",
                                                "frame_5.json": "File",
                                                "frame_6.json": "File",
                                                "frame_7.json": "File",
                                                "frame_8.json": "File",
                                                "frame_9.json": "File"
                                            }
                                        },
                                        "MakeInvisibleItems.json": "File",
                                        "MakeVisibleItems": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File",
                                                "frame_5.json": "File",
                                                "frame_6.json": "File",
                                                "frame_7.json": "File"
                                            }
                                        },
                                        "MakeVisibleItems.json": "File",
                                        "NavigateByClickAndKey": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File",
                                                "frame_5.json": "File",
                                                "frame_6.json": "File"
                                            }
                                        },
                                        "NavigateByClickAndKey.json": "File",
                                        "UpdateInvisibleItems": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File"
                                            }
                                        },
                                        "UpdateInvisibleItems.json": "File",
                                        "UpdateVisibleItems": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File",
                                                "frame_5.json": "File"
                                            }
                                        },
                                        "UpdateVisibleItems.json": "File"
                                    }
                                },
                                "Information": {
                                    "type": "Folder",
                                    "content": {
                                        "MakeInvisibleItems": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_10.json": "File",
                                                "frame_11.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File",
                                                "frame_5.json": "File",
                                                "frame_6.json": "File",
                                                "frame_7.json": "File",
                                                "frame_8.json": "File",
                                                "frame_9.json": "File"
                                            }
                                        },
                                        "MakeInvisibleItems.json": "File",
                                        "MakeVisibleItems": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File",
                                                "frame_5.json": "File",
                                                "frame_6.json": "File",
                                                "frame_7.json": "File"
                                            }
                                        },
                                        "MakeVisibleItems.json": "File",
                                        "NavigateByClickAndKey": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File",
                                                "frame_5.json": "File",
                                                "frame_6.json": "File"
                                            }
                                        },
                                        "NavigateByClickAndKey.json": "File",
                                        "UpdateInvisibleItems": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File"
                                            }
                                        },
                                        "UpdateInvisibleItems.json": "File",
                                        "UpdateVisibleItems": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File",
                                                "frame_5.json": "File"
                                            }
                                        },
                                        "UpdateVisibleItems.json": "File"
                                    }
                                },
                                "List": {
                                    "type": "Folder",
                                    "content": {
                                        "MakeInvisibleItems": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_10.json": "File",
                                                "frame_11.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File",
                                                "frame_5.json": "File",
                                                "frame_6.json": "File",
                                                "frame_7.json": "File",
                                                "frame_8.json": "File",
                                                "frame_9.json": "File"
                                            }
                                        },
                                        "MakeInvisibleItems.json": "File",
                                        "MakeVisibleItems": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File",
                                                "frame_5.json": "File",
                                                "frame_6.json": "File",
                                                "frame_7.json": "File"
                                            }
                                        },
                                        "MakeVisibleItems.json": "File",
                                        "NavigateByClickAndKey": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File",
                                                "frame_5.json": "File",
                                                "frame_6.json": "File",
                                                "frame_7.json": "File",
                                                "frame_8.json": "File"
                                            }
                                        },
                                        "NavigateByClickAndKey.json": "File",
                                        "UpdateInvisibleItems": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File"
                                            }
                                        },
                                        "UpdateInvisibleItems.json": "File",
                                        "UpdateVisibleItems": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File"
                                            }
                                        },
                                        "UpdateVisibleItems.json": "File"
                                    }
                                },
                                "PropertyBinding": {
                                    "type": "Folder",
                                    "content": {
                                        "frame_0.json": "File",
                                        "frame_1.json": "File",
                                        "frame_2.json": "File",
                                        "frame_3.json": "File",
                                        "frame_4.json": "File"
                                    }
                                },
                                "PropertyBinding.json": "File",
                                "SmallIcon": {
                                    "type": "Folder",
                                    "content": {
                                        "MakeInvisibleItems": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_10.json": "File",
                                                "frame_11.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File",
                                                "frame_5.json": "File",
                                                "frame_6.json": "File",
                                                "frame_7.json": "File",
                                                "frame_8.json": "File",
                                                "frame_9.json": "File"
                                            }
                                        },
                                        "MakeInvisibleItems.json": "File",
                                        "MakeVisibleItems": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File",
                                                "frame_5.json": "File",
                                                "frame_6.json": "File",
                                                "frame_7.json": "File"
                                            }
                                        },
                                        "MakeVisibleItems.json": "File",
                                        "NavigateByClickAndKey": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File",
                                                "frame_5.json": "File",
                                                "frame_6.json": "File",
                                                "frame_7.json": "File",
                                                "frame_8.json": "File"
                                            }
                                        },
                                        "NavigateByClickAndKey.json": "File",
                                        "UpdateInvisibleItems": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File"
                                            }
                                        },
                                        "UpdateInvisibleItems.json": "File",
                                        "UpdateVisibleItems": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File"
                                            }
                                        },
                                        "UpdateVisibleItems.json": "File"
                                    }
                                },
                                "SwitchViews": {
                                    "type": "Folder",
                                    "content": {
                                        "frame_0.json": "File",
                                        "frame_1.json": "File",
                                        "frame_2.json": "File",
                                        "frame_3.json": "File",
                                        "frame_4.json": "File",
                                        "frame_5.json": "File",
                                        "frame_6.json": "File",
                                        "frame_7.json": "File"
                                    }
                                },
                                "SwitchViews.json": "File",
                                "Tile": {
                                    "type": "Folder",
                                    "content": {
                                        "MakeInvisibleItems": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_10.json": "File",
                                                "frame_11.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File",
                                                "frame_5.json": "File",
                                                "frame_6.json": "File",
                                                "frame_7.json": "File",
                                                "frame_8.json": "File",
                                                "frame_9.json": "File"
                                            }
                                        },
                                        "MakeInvisibleItems.json": "File",
                                        "MakeVisibleItems": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File",
                                                "frame_5.json": "File",
                                                "frame_6.json": "File",
                                                "frame_7.json": "File"
                                            }
                                        },
                                        "MakeVisibleItems.json": "File",
                                        "NavigateByClickAndKey": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File",
                                                "frame_5.json": "File",
                                                "frame_6.json": "File",
                                                "frame_7.json": "File",
                                                "frame_8.json": "File"
                                            }
                                        },
                                        "NavigateByClickAndKey.json": "File",
                                        "UpdateInvisibleItems": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File"
                                            }
                                        },
                                        "UpdateInvisibleItems.json": "File",
                                        "UpdateVisibleItems": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File",
                                                "frame_5.json": "File"
                                            }
                                        },
                                        "UpdateVisibleItems.json": "File"
                                    }
                                }
                            }
                        },
                        "GuiBindableTextList": {
                            "type": "Folder",
                            "content": {
                                "CheckItemsByKey": {
                                    "type": "Folder",
                                    "content": {
                                        "frame_0.json": "File",
                                        "frame_1.json": "File",
                                        "frame_10.json": "File",
                                        "frame_2.json": "File",
                                        "frame_3.json": "File",
                                        "frame_4.json": "File",
                                        "frame_5.json": "File",
                                        "frame_6.json": "File",
                                        "frame_7.json": "File",
                                        "frame_8.json": "File",
                                        "frame_9.json": "File"
                                    }
                                },
                                "CheckItemsByKey.json": "File",
                                "ClickVisibleItems": {
                                    "type": "Folder",
                                    "content": {
                                        "frame_0.json": "File",
                                        "frame_1.json": "File",
                                        "frame_2.json": "File",
                                        "frame_3.json": "File",
                                        "frame_4.json": "File"
                                    }
                                },
                                "ClickVisibleItems.json": "File",
                                "GuiTextListItemTemplate": {
                                    "type": "Folder",
                                    "content": {
                                        "ClickVisibleItems": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File"
                                            }
                                        },
                                        "ClickVisibleItems.json": "File",
                                        "UpdateInvisibleItems": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File"
                                            }
                                        },
                                        "UpdateInvisibleItems.json": "File",
                                        "UpdateVisibleItems": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File",
                                                "frame_5.json": "File"
                                            }
                                        },
                                        "UpdateVisibleItems.json": "File"
                                    }
                                },
                                "MakeInvisibleItems": {
                                    "type": "Folder",
                                    "content": {
                                        "frame_0.json": "File",
                                        "frame_1.json": "File",
                                        "frame_10.json": "File",
                                        "frame_11.json": "File",
                                        "frame_2.json": "File",
                                        "frame_3.json": "File",
                                        "frame_4.json": "File",
                                        "frame_5.json": "File",
                                        "frame_6.json": "File",
                                        "frame_7.json": "File",
                                        "frame_8.json": "File",
                                        "frame_9.json": "File"
                                    }
                                },
                                "MakeInvisibleItems.json": "File",
                                "MakeVisibleItems": {
                                    "type": "Folder",
                                    "content": {
                                        "frame_0.json": "File",
                                        "frame_1.json": "File",
                                        "frame_2.json": "File",
                                        "frame_3.json": "File",
                                        "frame_4.json": "File",
                                        "frame_5.json": "File",
                                        "frame_6.json": "File",
                                        "frame_7.json": "File"
                                    }
                                },
                                "MakeVisibleItems.json": "File",
                                "PropertyBinding": {
                                    "type": "Folder",
                                    "content": {
                                        "frame_0.json": "File",
                                        "frame_1.json": "File",
                                        "frame_2.json": "File",
                                        "frame_3.json": "File",
                                        "frame_4.json": "File"
                                    }
                                },
                                "PropertyBinding.json": "File",
                                "UpdateInvisibleItems": {
                                    "type": "Folder",
                                    "content": {
                                        "frame_0.json": "File",
                                        "frame_1.json": "File",
                                        "frame_2.json": "File",
                                        "frame_3.json": "File",
                                        "frame_4.json": "File"
                                    }
                                },
                                "UpdateInvisibleItems.json": "File",
                                "UpdateVisibleItems": {
                                    "type": "Folder",
                                    "content": {
                                        "frame_0.json": "File",
                                        "frame_1.json": "File",
                                        "frame_2.json": "File",
                                        "frame_3.json": "File",
                                        "frame_4.json": "File",
                                        "frame_5.json": "File"
                                    }
                                },
                                "UpdateVisibleItems.json": "File"
                            }
                        },
                        "GuiBindableTreeView": {
                            "type": "Folder",
                            "content": {
                                "ClickAndExpandCollapseItems": {
                                    "type": "Folder",
                                    "content": {
                                        "frame_0.json": "File",
                                        "frame_1.json": "File",
                                        "frame_2.json": "File",
                                        "frame_3.json": "File",
                                        "frame_4.json": "File",
                                        "frame_5.json": "File",
                                        "frame_6.json": "File",
                                        "frame_7.json": "File"
                                    }
                                },
                                "ClickAndExpandCollapseItems.json": "File",
                                "DBClickAndExpandCollapseItems": {
                                    "type": "Folder",
                                    "content": {
                                        "frame_0.json": "File",
                                        "frame_1.json": "File",
                                        "frame_2.json": "File",
                                        "frame_3.json": "File",
                                        "frame_4.json": "File",
                                        "frame_5.json": "File",
                                        "frame_6.json": "File",
                                        "frame_7.json": "File"
                                    }
                                },
                                "DBClickAndExpandCollapseItems.json": "File",
                                "Image": {
                                    "type": "Folder",
                                    "content": {
                                        "frame_0.json": "File",
                                        "frame_1.json": "File"
                                    }
                                },
                                "Image.json": "File",
                                "KeyAndExpandCollapseItems": {
                                    "type": "Folder",
                                    "content": {
                                        "frame_0.json": "File",
                                        "frame_1.json": "File",
                                        "frame_2.json": "File",
                                        "frame_3.json": "File",
                                        "frame_4.json": "File",
                                        "frame_5.json": "File",
                                        "frame_6.json": "File",
                                        "frame_7.json": "File"
                                    }
                                },
                                "KeyAndExpandCollapseItems.json": "File",
                                "MakeInvisibleChildItems": {
                                    "type": "Folder",
                                    "content": {
                                        "frame_0.json": "File",
                                        "frame_1.json": "File",
                                        "frame_2.json": "File",
                                        "frame_3.json": "File",
                                        "frame_4.json": "File"
                                    }
                                },
                                "MakeInvisibleChildItems.json": "File",
                                "MakeInvisibleItems": {
                                    "type": "Folder",
                                    "content": {
                                        "frame_0.json": "File",
                                        "frame_1.json": "File",
                                        "frame_10.json": "File",
                                        "frame_11.json": "File",
                                        "frame_2.json": "File",
                                        "frame_3.json": "File",
                                        "frame_4.json": "File",
                                        "frame_5.json": "File",
                                        "frame_6.json": "File",
                                        "frame_7.json": "File",
                                        "frame_8.json": "File",
                                        "frame_9.json": "File"
                                    }
                                },
                                "MakeInvisibleItems.json": "File",
                                "MakeVisibleChildItems": {
                                    "type": "Folder",
                                    "content": {
                                        "frame_0.json": "File",
                                        "frame_1.json": "File",
                                        "frame_2.json": "File",
                                        "frame_3.json": "File",
                                        "frame_4.json": "File",
                                        "frame_5.json": "File",
                                        "frame_6.json": "File",
                                        "frame_7.json": "File"
                                    }
                                },
                                "MakeVisibleChildItems.json": "File",
                                "MakeVisibleItems": {
                                    "type": "Folder",
                                    "content": {
                                        "frame_0.json": "File",
                                        "frame_1.json": "File",
                                        "frame_2.json": "File",
                                        "frame_3.json": "File",
                                        "frame_4.json": "File",
                                        "frame_5.json": "File",
                                        "frame_6.json": "File",
                                        "frame_7.json": "File"
                                    }
                                },
                                "MakeVisibleItems.json": "File",
                                "PropertyBinding": {
                                    "type": "Folder",
                                    "content": {
                                        "frame_0.json": "File",
                                        "frame_1.json": "File",
                                        "frame_2.json": "File",
                                        "frame_3.json": "File",
                                        "frame_4.json": "File"
                                    }
                                },
                                "PropertyBinding.json": "File",
                                "UpdateInvisibleChildItems": {
                                    "type": "Folder",
                                    "content": {
                                        "frame_0.json": "File",
                                        "frame_1.json": "File",
                                        "frame_2.json": "File",
                                        "frame_3.json": "File",
                                        "frame_4.json": "File",
                                        "frame_5.json": "File"
                                    }
                                },
                                "UpdateInvisibleChildItems.json": "File",
                                "UpdateInvisibleItems": {
                                    "type": "Folder",
                                    "content": {
                                        "frame_0.json": "File",
                                        "frame_1.json": "File",
                                        "frame_2.json": "File",
                                        "frame_3.json": "File",
                                        "frame_4.json": "File"
                                    }
                                },
                                "UpdateInvisibleItems.json": "File",
                                "UpdateVisibleChildItems": {
                                    "type": "Folder",
                                    "content": {
                                        "frame_0.json": "File",
                                        "frame_1.json": "File",
                                        "frame_2.json": "File",
                                        "frame_3.json": "File",
                                        "frame_4.json": "File"
                                    }
                                },
                                "UpdateVisibleChildItems.json": "File",
                                "UpdateVisibleItems": {
                                    "type": "Folder",
                                    "content": {
                                        "frame_0.json": "File",
                                        "frame_1.json": "File",
                                        "frame_2.json": "File",
                                        "frame_3.json": "File",
                                        "frame_4.json": "File"
                                    }
                                },
                                "UpdateVisibleItems.json": "File"
                            }
                        },
                        "GuiListControl": {
                            "type": "Folder",
                            "content": {
                                "GuiBindableDataGrid": {
                                    "type": "Folder",
                                    "content": {
                                        "LeftMouseEvents": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File",
                                                "frame_5.json": "File",
                                                "frame_6.json": "File",
                                                "frame_7.json": "File"
                                            }
                                        },
                                        "LeftMouseEvents.json": "File",
                                        "MiddleMouseEvents": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File",
                                                "frame_5.json": "File",
                                                "frame_6.json": "File",
                                                "frame_7.json": "File"
                                            }
                                        },
                                        "MiddleMouseEvents.json": "File",
                                        "MouseWheel": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File",
                                                "frame_5.json": "File"
                                            }
                                        },
                                        "MouseWheel.json": "File",
                                        "RightMouseEvents": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File",
                                                "frame_5.json": "File",
                                                "frame_6.json": "File",
                                                "frame_7.json": "File"
                                            }
                                        },
                                        "RightMouseEvents.json": "File",
                                        "Scrolling": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File",
                                                "frame_5.json": "File",
                                                "frame_6.json": "File"
                                            }
                                        },
                                        "Scrolling.json": "File"
                                    }
                                },
                                "GuiBindableListView": {
                                    "type": "Folder",
                                    "content": {
                                        "LeftMouseEvents": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File",
                                                "frame_5.json": "File",
                                                "frame_6.json": "File",
                                                "frame_7.json": "File"
                                            }
                                        },
                                        "LeftMouseEvents.json": "File",
                                        "MiddleMouseEvents": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File",
                                                "frame_5.json": "File",
                                                "frame_6.json": "File",
                                                "frame_7.json": "File"
                                            }
                                        },
                                        "MiddleMouseEvents.json": "File",
                                        "MouseWheel": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File",
                                                "frame_5.json": "File"
                                            }
                                        },
                                        "MouseWheel.json": "File",
                                        "RightMouseEvents": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File",
                                                "frame_5.json": "File",
                                                "frame_6.json": "File",
                                                "frame_7.json": "File"
                                            }
                                        },
                                        "RightMouseEvents.json": "File",
                                        "Scrolling": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File",
                                                "frame_5.json": "File",
                                                "frame_6.json": "File"
                                            }
                                        },
                                        "Scrolling.json": "File"
                                    }
                                },
                                "GuiBindableTextList": {
                                    "type": "Folder",
                                    "content": {
                                        "LeftMouseEvents": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File",
                                                "frame_5.json": "File",
                                                "frame_6.json": "File",
                                                "frame_7.json": "File"
                                            }
                                        },
                                        "LeftMouseEvents.json": "File",
                                        "MiddleMouseEvents": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File",
                                                "frame_5.json": "File",
                                                "frame_6.json": "File",
                                                "frame_7.json": "File"
                                            }
                                        },
                                        "MiddleMouseEvents.json": "File",
                                        "MouseWheel": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File",
                                                "frame_5.json": "File"
                                            }
                                        },
                                        "MouseWheel.json": "File",
                                        "RightMouseEvents": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File",
                                                "frame_5.json": "File",
                                                "frame_6.json": "File",
                                                "frame_7.json": "File"
                                            }
                                        },
                                        "RightMouseEvents.json": "File",
                                        "Scrolling": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File",
                                                "frame_5.json": "File",
                                                "frame_6.json": "File"
                                            }
                                        },
                                        "Scrolling.json": "File"
                                    }
                                },
                                "GuiBindableTreeView": {
                                    "type": "Folder",
                                    "content": {
                                        "LeftMouseEvents": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File",
                                                "frame_5.json": "File",
                                                "frame_6.json": "File",
                                                "frame_7.json": "File"
                                            }
                                        },
                                        "LeftMouseEvents.json": "File",
                                        "MiddleMouseEvents": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File",
                                                "frame_5.json": "File",
                                                "frame_6.json": "File",
                                                "frame_7.json": "File"
                                            }
                                        },
                                        "MiddleMouseEvents.json": "File",
                                        "MouseWheel": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File",
                                                "frame_5.json": "File"
                                            }
                                        },
                                        "MouseWheel.json": "File",
                                        "RightMouseEvents": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File",
                                                "frame_5.json": "File",
                                                "frame_6.json": "File",
                                                "frame_7.json": "File"
                                            }
                                        },
                                        "RightMouseEvents.json": "File",
                                        "Scrolling": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File",
                                                "frame_5.json": "File",
                                                "frame_6.json": "File"
                                            }
                                        },
                                        "Scrolling.json": "File"
                                    }
                                },
                                "GuiListView": {
                                    "type": "Folder",
                                    "content": {
                                        "LeftMouseEvents": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File",
                                                "frame_5.json": "File",
                                                "frame_6.json": "File",
                                                "frame_7.json": "File"
                                            }
                                        },
                                        "LeftMouseEvents.json": "File",
                                        "MiddleMouseEvents": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File",
                                                "frame_5.json": "File",
                                                "frame_6.json": "File",
                                                "frame_7.json": "File"
                                            }
                                        },
                                        "MiddleMouseEvents.json": "File",
                                        "MouseWheel": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File",
                                                "frame_5.json": "File"
                                            }
                                        },
                                        "MouseWheel.json": "File",
                                        "RightMouseEvents": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File",
                                                "frame_5.json": "File",
                                                "frame_6.json": "File",
                                                "frame_7.json": "File"
                                            }
                                        },
                                        "RightMouseEvents.json": "File",
                                        "Scrolling": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File",
                                                "frame_5.json": "File",
                                                "frame_6.json": "File"
                                            }
                                        },
                                        "Scrolling.json": "File"
                                    }
                                },
                                "GuiTextList": {
                                    "type": "Folder",
                                    "content": {
                                        "LeftMouseEvents": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File",
                                                "frame_5.json": "File",
                                                "frame_6.json": "File",
                                                "frame_7.json": "File"
                                            }
                                        },
                                        "LeftMouseEvents.json": "File",
                                        "MiddleMouseEvents": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File",
                                                "frame_5.json": "File",
                                                "frame_6.json": "File",
                                                "frame_7.json": "File"
                                            }
                                        },
                                        "MiddleMouseEvents.json": "File",
                                        "MouseWheel": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File",
                                                "frame_5.json": "File"
                                            }
                                        },
                                        "MouseWheel.json": "File",
                                        "RightMouseEvents": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File",
                                                "frame_5.json": "File",
                                                "frame_6.json": "File",
                                                "frame_7.json": "File"
                                            }
                                        },
                                        "RightMouseEvents.json": "File",
                                        "Scrolling": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File",
                                                "frame_5.json": "File",
                                                "frame_6.json": "File"
                                            }
                                        },
                                        "Scrolling.json": "File"
                                    }
                                },
                                "GuiTreeView": {
                                    "type": "Folder",
                                    "content": {
                                        "LeftMouseEvents": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File",
                                                "frame_5.json": "File",
                                                "frame_6.json": "File",
                                                "frame_7.json": "File"
                                            }
                                        },
                                        "LeftMouseEvents.json": "File",
                                        "MiddleMouseEvents": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File",
                                                "frame_5.json": "File",
                                                "frame_6.json": "File",
                                                "frame_7.json": "File"
                                            }
                                        },
                                        "MiddleMouseEvents.json": "File",
                                        "MouseWheel": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File",
                                                "frame_5.json": "File"
                                            }
                                        },
                                        "MouseWheel.json": "File",
                                        "RightMouseEvents": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File",
                                                "frame_5.json": "File",
                                                "frame_6.json": "File",
                                                "frame_7.json": "File"
                                            }
                                        },
                                        "RightMouseEvents.json": "File",
                                        "Scrolling": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File",
                                                "frame_5.json": "File",
                                                "frame_6.json": "File"
                                            }
                                        },
                                        "Scrolling.json": "File"
                                    }
                                }
                            }
                        },
                        "GuiListItemTemplate": {
                            "type": "Folder",
                            "content": {
                                "GuiBindableDataGrid": {
                                    "type": "Folder",
                                    "content": {
                                        "ArrangerAndAxis": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File",
                                                "frame_5.json": "File",
                                                "frame_6.json": "File",
                                                "frame_7.json": "File"
                                            }
                                        },
                                        "ArrangerAndAxis.json": "File",
                                        "ArrangerAndAxisWithScrolls": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_10.json": "File",
                                                "frame_11.json": "File",
                                                "frame_12.json": "File",
                                                "frame_13.json": "File",
                                                "frame_14.json": "File",
                                                "frame_15.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File",
                                                "frame_5.json": "File",
                                                "frame_6.json": "File",
                                                "frame_7.json": "File",
                                                "frame_8.json": "File",
                                                "frame_9.json": "File"
                                            }
                                        },
                                        "ArrangerAndAxisWithScrolls.json": "File",
                                        "Context": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File"
                                            }
                                        },
                                        "Context.json": "File",
                                        "DisplayItemBackground": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File",
                                                "frame_5.json": "File"
                                            }
                                        },
                                        "DisplayItemBackground.json": "File",
                                        "Font": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File"
                                            }
                                        },
                                        "Font.json": "File",
                                        "MouseVisualEffect": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File",
                                                "frame_5.json": "File"
                                            }
                                        },
                                        "MouseVisualEffect.json": "File"
                                    }
                                },
                                "GuiBindableListView": {
                                    "type": "Folder",
                                    "content": {
                                        "ArrangerAndAxis": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File",
                                                "frame_5.json": "File",
                                                "frame_6.json": "File",
                                                "frame_7.json": "File"
                                            }
                                        },
                                        "ArrangerAndAxis.json": "File",
                                        "ArrangerAndAxisWithScrolls": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_10.json": "File",
                                                "frame_11.json": "File",
                                                "frame_12.json": "File",
                                                "frame_13.json": "File",
                                                "frame_14.json": "File",
                                                "frame_15.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File",
                                                "frame_5.json": "File",
                                                "frame_6.json": "File",
                                                "frame_7.json": "File",
                                                "frame_8.json": "File",
                                                "frame_9.json": "File"
                                            }
                                        },
                                        "ArrangerAndAxisWithScrolls.json": "File",
                                        "Context": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File"
                                            }
                                        },
                                        "Context.json": "File",
                                        "DisplayItemBackground": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File",
                                                "frame_5.json": "File"
                                            }
                                        },
                                        "DisplayItemBackground.json": "File",
                                        "Font": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File"
                                            }
                                        },
                                        "Font.json": "File",
                                        "MouseVisualEffect": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File",
                                                "frame_5.json": "File"
                                            }
                                        },
                                        "MouseVisualEffect.json": "File"
                                    }
                                },
                                "GuiBindableTextList": {
                                    "type": "Folder",
                                    "content": {
                                        "ArrangerAndAxis": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File",
                                                "frame_5.json": "File",
                                                "frame_6.json": "File",
                                                "frame_7.json": "File"
                                            }
                                        },
                                        "ArrangerAndAxis.json": "File",
                                        "ArrangerAndAxisWithScrolls": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_10.json": "File",
                                                "frame_11.json": "File",
                                                "frame_12.json": "File",
                                                "frame_13.json": "File",
                                                "frame_14.json": "File",
                                                "frame_15.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File",
                                                "frame_5.json": "File",
                                                "frame_6.json": "File",
                                                "frame_7.json": "File",
                                                "frame_8.json": "File",
                                                "frame_9.json": "File"
                                            }
                                        },
                                        "ArrangerAndAxisWithScrolls.json": "File",
                                        "Context": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File"
                                            }
                                        },
                                        "Context.json": "File",
                                        "DisplayItemBackground": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File",
                                                "frame_5.json": "File"
                                            }
                                        },
                                        "DisplayItemBackground.json": "File",
                                        "Font": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File"
                                            }
                                        },
                                        "Font.json": "File",
                                        "MouseVisualEffect": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File",
                                                "frame_5.json": "File"
                                            }
                                        },
                                        "MouseVisualEffect.json": "File"
                                    }
                                },
                                "GuiBindableTreeView": {
                                    "type": "Folder",
                                    "content": {
                                        "ArrangerAndAxis": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File",
                                                "frame_5.json": "File",
                                                "frame_6.json": "File",
                                                "frame_7.json": "File"
                                            }
                                        },
                                        "ArrangerAndAxis.json": "File",
                                        "ArrangerAndAxisWithScrolls": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_10.json": "File",
                                                "frame_11.json": "File",
                                                "frame_12.json": "File",
                                                "frame_13.json": "File",
                                                "frame_14.json": "File",
                                                "frame_15.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File",
                                                "frame_5.json": "File",
                                                "frame_6.json": "File",
                                                "frame_7.json": "File",
                                                "frame_8.json": "File",
                                                "frame_9.json": "File"
                                            }
                                        },
                                        "ArrangerAndAxisWithScrolls.json": "File",
                                        "Context": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File"
                                            }
                                        },
                                        "Context.json": "File",
                                        "DisplayItemBackground": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File",
                                                "frame_5.json": "File"
                                            }
                                        },
                                        "DisplayItemBackground.json": "File",
                                        "Font": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File"
                                            }
                                        },
                                        "Font.json": "File",
                                        "MouseVisualEffect": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File",
                                                "frame_5.json": "File"
                                            }
                                        },
                                        "MouseVisualEffect.json": "File"
                                    }
                                },
                                "GuiListView": {
                                    "type": "Folder",
                                    "content": {
                                        "ArrangerAndAxis": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File",
                                                "frame_5.json": "File",
                                                "frame_6.json": "File",
                                                "frame_7.json": "File"
                                            }
                                        },
                                        "ArrangerAndAxis.json": "File",
                                        "ArrangerAndAxisWithScrolls": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_10.json": "File",
                                                "frame_11.json": "File",
                                                "frame_12.json": "File",
                                                "frame_13.json": "File",
                                                "frame_14.json": "File",
                                                "frame_15.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File",
                                                "frame_5.json": "File",
                                                "frame_6.json": "File",
                                                "frame_7.json": "File",
                                                "frame_8.json": "File",
                                                "frame_9.json": "File"
                                            }
                                        },
                                        "ArrangerAndAxisWithScrolls.json": "File",
                                        "Context": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File"
                                            }
                                        },
                                        "Context.json": "File",
                                        "DisplayItemBackground": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File",
                                                "frame_5.json": "File"
                                            }
                                        },
                                        "DisplayItemBackground.json": "File",
                                        "Font": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File"
                                            }
                                        },
                                        "Font.json": "File",
                                        "MouseVisualEffect": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File",
                                                "frame_5.json": "File"
                                            }
                                        },
                                        "MouseVisualEffect.json": "File"
                                    }
                                },
                                "GuiTextList": {
                                    "type": "Folder",
                                    "content": {
                                        "ArrangerAndAxis": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File",
                                                "frame_5.json": "File",
                                                "frame_6.json": "File",
                                                "frame_7.json": "File"
                                            }
                                        },
                                        "ArrangerAndAxis.json": "File",
                                        "ArrangerAndAxisWithScrolls": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_10.json": "File",
                                                "frame_11.json": "File",
                                                "frame_12.json": "File",
                                                "frame_13.json": "File",
                                                "frame_14.json": "File",
                                                "frame_15.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File",
                                                "frame_5.json": "File",
                                                "frame_6.json": "File",
                                                "frame_7.json": "File",
                                                "frame_8.json": "File",
                                                "frame_9.json": "File"
                                            }
                                        },
                                        "ArrangerAndAxisWithScrolls.json": "File",
                                        "Context": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File"
                                            }
                                        },
                                        "Context.json": "File",
                                        "DisplayItemBackground": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File",
                                                "frame_5.json": "File"
                                            }
                                        },
                                        "DisplayItemBackground.json": "File",
                                        "Font": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File"
                                            }
                                        },
                                        "Font.json": "File",
                                        "MouseVisualEffect": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File",
                                                "frame_5.json": "File"
                                            }
                                        },
                                        "MouseVisualEffect.json": "File"
                                    }
                                },
                                "GuiTreeView": {
                                    "type": "Folder",
                                    "content": {
                                        "ArrangerAndAxis": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File",
                                                "frame_5.json": "File",
                                                "frame_6.json": "File",
                                                "frame_7.json": "File"
                                            }
                                        },
                                        "ArrangerAndAxis.json": "File",
                                        "ArrangerAndAxisWithScrolls": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_10.json": "File",
                                                "frame_11.json": "File",
                                                "frame_12.json": "File",
                                                "frame_13.json": "File",
                                                "frame_14.json": "File",
                                                "frame_15.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File",
                                                "frame_5.json": "File",
                                                "frame_6.json": "File",
                                                "frame_7.json": "File",
                                                "frame_8.json": "File",
                                                "frame_9.json": "File"
                                            }
                                        },
                                        "ArrangerAndAxisWithScrolls.json": "File",
                                        "Context": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File"
                                            }
                                        },
                                        "Context.json": "File",
                                        "DisplayItemBackground": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File",
                                                "frame_5.json": "File"
                                            }
                                        },
                                        "DisplayItemBackground.json": "File",
                                        "Font": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File"
                                            }
                                        },
                                        "Font.json": "File",
                                        "MouseVisualEffect": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File",
                                                "frame_5.json": "File"
                                            }
                                        },
                                        "MouseVisualEffect.json": "File"
                                    }
                                }
                            }
                        },
                        "GuiListView": {
                            "type": "Folder",
                            "content": {
                                "BigIcon": {
                                    "type": "Folder",
                                    "content": {
                                        "MakeInvisibleItems": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_10.json": "File",
                                                "frame_11.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File",
                                                "frame_5.json": "File",
                                                "frame_6.json": "File",
                                                "frame_7.json": "File",
                                                "frame_8.json": "File",
                                                "frame_9.json": "File"
                                            }
                                        },
                                        "MakeInvisibleItems.json": "File",
                                        "MakeVisibleItems": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File",
                                                "frame_5.json": "File",
                                                "frame_6.json": "File",
                                                "frame_7.json": "File"
                                            }
                                        },
                                        "MakeVisibleItems.json": "File",
                                        "NavigateByClickAndKey": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File",
                                                "frame_5.json": "File",
                                                "frame_6.json": "File",
                                                "frame_7.json": "File",
                                                "frame_8.json": "File"
                                            }
                                        },
                                        "NavigateByClickAndKey.json": "File",
                                        "UpdateInvisibleItems": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File"
                                            }
                                        },
                                        "UpdateInvisibleItems.json": "File",
                                        "UpdateVisibleItems": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File"
                                            }
                                        },
                                        "UpdateVisibleItems.json": "File"
                                    }
                                },
                                "Detail": {
                                    "type": "Folder",
                                    "content": {
                                        "MakeInvisibleItems": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_10.json": "File",
                                                "frame_11.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File",
                                                "frame_5.json": "File",
                                                "frame_6.json": "File",
                                                "frame_7.json": "File",
                                                "frame_8.json": "File",
                                                "frame_9.json": "File"
                                            }
                                        },
                                        "MakeInvisibleItems.json": "File",
                                        "MakeVisibleItems": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File",
                                                "frame_5.json": "File",
                                                "frame_6.json": "File",
                                                "frame_7.json": "File"
                                            }
                                        },
                                        "MakeVisibleItems.json": "File",
                                        "NavigateByClickAndKey": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File",
                                                "frame_5.json": "File",
                                                "frame_6.json": "File"
                                            }
                                        },
                                        "NavigateByClickAndKey.json": "File",
                                        "UpdateInvisibleItems": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File"
                                            }
                                        },
                                        "UpdateInvisibleItems.json": "File",
                                        "UpdateVisibleItems": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File",
                                                "frame_5.json": "File"
                                            }
                                        },
                                        "UpdateVisibleItems.json": "File"
                                    }
                                },
                                "Information": {
                                    "type": "Folder",
                                    "content": {
                                        "MakeInvisibleItems": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_10.json": "File",
                                                "frame_11.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File",
                                                "frame_5.json": "File",
                                                "frame_6.json": "File",
                                                "frame_7.json": "File",
                                                "frame_8.json": "File",
                                                "frame_9.json": "File"
                                            }
                                        },
                                        "MakeInvisibleItems.json": "File",
                                        "MakeVisibleItems": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File",
                                                "frame_5.json": "File",
                                                "frame_6.json": "File",
                                                "frame_7.json": "File"
                                            }
                                        },
                                        "MakeVisibleItems.json": "File",
                                        "NavigateByClickAndKey": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File",
                                                "frame_5.json": "File",
                                                "frame_6.json": "File"
                                            }
                                        },
                                        "NavigateByClickAndKey.json": "File",
                                        "UpdateInvisibleItems": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File"
                                            }
                                        },
                                        "UpdateInvisibleItems.json": "File",
                                        "UpdateVisibleItems": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File",
                                                "frame_5.json": "File"
                                            }
                                        },
                                        "UpdateVisibleItems.json": "File"
                                    }
                                },
                                "List": {
                                    "type": "Folder",
                                    "content": {
                                        "MakeInvisibleItems": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_10.json": "File",
                                                "frame_11.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File",
                                                "frame_5.json": "File",
                                                "frame_6.json": "File",
                                                "frame_7.json": "File",
                                                "frame_8.json": "File",
                                                "frame_9.json": "File"
                                            }
                                        },
                                        "MakeInvisibleItems.json": "File",
                                        "MakeVisibleItems": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File",
                                                "frame_5.json": "File",
                                                "frame_6.json": "File",
                                                "frame_7.json": "File"
                                            }
                                        },
                                        "MakeVisibleItems.json": "File",
                                        "NavigateByClickAndKey": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File",
                                                "frame_5.json": "File",
                                                "frame_6.json": "File",
                                                "frame_7.json": "File",
                                                "frame_8.json": "File"
                                            }
                                        },
                                        "NavigateByClickAndKey.json": "File",
                                        "UpdateInvisibleItems": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File"
                                            }
                                        },
                                        "UpdateInvisibleItems.json": "File",
                                        "UpdateVisibleItems": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File"
                                            }
                                        },
                                        "UpdateVisibleItems.json": "File"
                                    }
                                },
                                "SmallIcon": {
                                    "type": "Folder",
                                    "content": {
                                        "MakeInvisibleItems": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_10.json": "File",
                                                "frame_11.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File",
                                                "frame_5.json": "File",
                                                "frame_6.json": "File",
                                                "frame_7.json": "File",
                                                "frame_8.json": "File",
                                                "frame_9.json": "File"
                                            }
                                        },
                                        "MakeInvisibleItems.json": "File",
                                        "MakeVisibleItems": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File",
                                                "frame_5.json": "File",
                                                "frame_6.json": "File",
                                                "frame_7.json": "File"
                                            }
                                        },
                                        "MakeVisibleItems.json": "File",
                                        "NavigateByClickAndKey": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File",
                                                "frame_5.json": "File",
                                                "frame_6.json": "File",
                                                "frame_7.json": "File",
                                                "frame_8.json": "File"
                                            }
                                        },
                                        "NavigateByClickAndKey.json": "File",
                                        "UpdateInvisibleItems": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File"
                                            }
                                        },
                                        "UpdateInvisibleItems.json": "File",
                                        "UpdateVisibleItems": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File"
                                            }
                                        },
                                        "UpdateVisibleItems.json": "File"
                                    }
                                },
                                "SwitchViews": {
                                    "type": "Folder",
                                    "content": {
                                        "frame_0.json": "File",
                                        "frame_1.json": "File",
                                        "frame_2.json": "File",
                                        "frame_3.json": "File",
                                        "frame_4.json": "File",
                                        "frame_5.json": "File",
                                        "frame_6.json": "File",
                                        "frame_7.json": "File"
                                    }
                                },
                                "SwitchViews.json": "File",
                                "Tile": {
                                    "type": "Folder",
                                    "content": {
                                        "MakeInvisibleItems": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_10.json": "File",
                                                "frame_11.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File",
                                                "frame_5.json": "File",
                                                "frame_6.json": "File",
                                                "frame_7.json": "File",
                                                "frame_8.json": "File",
                                                "frame_9.json": "File"
                                            }
                                        },
                                        "MakeInvisibleItems.json": "File",
                                        "MakeVisibleItems": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File",
                                                "frame_5.json": "File",
                                                "frame_6.json": "File",
                                                "frame_7.json": "File"
                                            }
                                        },
                                        "MakeVisibleItems.json": "File",
                                        "NavigateByClickAndKey": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File",
                                                "frame_5.json": "File",
                                                "frame_6.json": "File",
                                                "frame_7.json": "File",
                                                "frame_8.json": "File"
                                            }
                                        },
                                        "NavigateByClickAndKey.json": "File",
                                        "UpdateInvisibleItems": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File"
                                            }
                                        },
                                        "UpdateInvisibleItems.json": "File",
                                        "UpdateVisibleItems": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File",
                                                "frame_5.json": "File"
                                            }
                                        },
                                        "UpdateVisibleItems.json": "File"
                                    }
                                }
                            }
                        },
                        "GuiSelectableListControl": {
                            "type": "Folder",
                            "content": {
                                "GuiBindableDataGrid": {
                                    "type": "Folder",
                                    "content": {
                                        "MultiSelect": {
                                            "type": "Folder",
                                            "content": {
                                                "Click": {
                                                    "type": "Folder",
                                                    "content": {
                                                        "frame_0.json": "File",
                                                        "frame_1.json": "File",
                                                        "frame_2.json": "File",
                                                        "frame_3.json": "File",
                                                        "frame_4.json": "File",
                                                        "frame_5.json": "File",
                                                        "frame_6.json": "File",
                                                        "frame_7.json": "File",
                                                        "frame_8.json": "File",
                                                        "frame_9.json": "File"
                                                    }
                                                },
                                                "Click.json": "File",
                                                "Key": {
                                                    "type": "Folder",
                                                    "content": {
                                                        "frame_0.json": "File",
                                                        "frame_1.json": "File",
                                                        "frame_10.json": "File",
                                                        "frame_11.json": "File",
                                                        "frame_2.json": "File",
                                                        "frame_3.json": "File",
                                                        "frame_4.json": "File",
                                                        "frame_5.json": "File",
                                                        "frame_6.json": "File",
                                                        "frame_7.json": "File",
                                                        "frame_8.json": "File",
                                                        "frame_9.json": "File"
                                                    }
                                                },
                                                "Key.json": "File",
                                                "Properties": {
                                                    "type": "Folder",
                                                    "content": {
                                                        "frame_0.json": "File",
                                                        "frame_1.json": "File",
                                                        "frame_2.json": "File",
                                                        "frame_3.json": "File",
                                                        "frame_4.json": "File",
                                                        "frame_5.json": "File"
                                                    }
                                                },
                                                "Properties.json": "File",
                                                "SelectItemsByClick": {
                                                    "type": "Folder",
                                                    "content": {
                                                        "frame_0.json": "File",
                                                        "frame_1.json": "File",
                                                        "frame_2.json": "File",
                                                        "frame_3.json": "File",
                                                        "frame_4.json": "File",
                                                        "frame_5.json": "File",
                                                        "frame_6.json": "File",
                                                        "frame_7.json": "File",
                                                        "frame_8.json": "File",
                                                        "frame_9.json": "File"
                                                    }
                                                },
                                                "SelectItemsByClick.json": "File",
                                                "SelectItemsByKey": {
                                                    "type": "Folder",
                                                    "content": {
                                                        "frame_0.json": "File",
                                                        "frame_1.json": "File",
                                                        "frame_10.json": "File",
                                                        "frame_11.json": "File",
                                                        "frame_2.json": "File",
                                                        "frame_3.json": "File",
                                                        "frame_4.json": "File",
                                                        "frame_5.json": "File",
                                                        "frame_6.json": "File",
                                                        "frame_7.json": "File",
                                                        "frame_8.json": "File",
                                                        "frame_9.json": "File"
                                                    }
                                                },
                                                "SelectItemsByKey.json": "File"
                                            }
                                        },
                                        "SingleSelect": {
                                            "type": "Folder",
                                            "content": {
                                                "Click": {
                                                    "type": "Folder",
                                                    "content": {
                                                        "frame_0.json": "File",
                                                        "frame_1.json": "File",
                                                        "frame_2.json": "File",
                                                        "frame_3.json": "File",
                                                        "frame_4.json": "File",
                                                        "frame_5.json": "File",
                                                        "frame_6.json": "File",
                                                        "frame_7.json": "File",
                                                        "frame_8.json": "File",
                                                        "frame_9.json": "File"
                                                    }
                                                },
                                                "Click.json": "File",
                                                "Key": {
                                                    "type": "Folder",
                                                    "content": {
                                                        "frame_0.json": "File",
                                                        "frame_1.json": "File",
                                                        "frame_10.json": "File",
                                                        "frame_11.json": "File",
                                                        "frame_2.json": "File",
                                                        "frame_3.json": "File",
                                                        "frame_4.json": "File",
                                                        "frame_5.json": "File",
                                                        "frame_6.json": "File",
                                                        "frame_7.json": "File",
                                                        "frame_8.json": "File",
                                                        "frame_9.json": "File"
                                                    }
                                                },
                                                "Key.json": "File",
                                                "Properties": {
                                                    "type": "Folder",
                                                    "content": {
                                                        "frame_0.json": "File",
                                                        "frame_1.json": "File",
                                                        "frame_2.json": "File",
                                                        "frame_3.json": "File",
                                                        "frame_4.json": "File",
                                                        "frame_5.json": "File"
                                                    }
                                                },
                                                "Properties.json": "File",
                                                "SelectItemsByClick": {
                                                    "type": "Folder",
                                                    "content": {
                                                        "frame_0.json": "File",
                                                        "frame_1.json": "File",
                                                        "frame_2.json": "File",
                                                        "frame_3.json": "File",
                                                        "frame_4.json": "File",
                                                        "frame_5.json": "File",
                                                        "frame_6.json": "File",
                                                        "frame_7.json": "File",
                                                        "frame_8.json": "File",
                                                        "frame_9.json": "File"
                                                    }
                                                },
                                                "SelectItemsByClick.json": "File",
                                                "SelectItemsByKey": {
                                                    "type": "Folder",
                                                    "content": {
                                                        "frame_0.json": "File",
                                                        "frame_1.json": "File",
                                                        "frame_10.json": "File",
                                                        "frame_11.json": "File",
                                                        "frame_2.json": "File",
                                                        "frame_3.json": "File",
                                                        "frame_4.json": "File",
                                                        "frame_5.json": "File",
                                                        "frame_6.json": "File",
                                                        "frame_7.json": "File",
                                                        "frame_8.json": "File",
                                                        "frame_9.json": "File"
                                                    }
                                                },
                                                "SelectItemsByKey.json": "File"
                                            }
                                        }
                                    }
                                },
                                "GuiBindableListView": {
                                    "type": "Folder",
                                    "content": {
                                        "MultiSelect": {
                                            "type": "Folder",
                                            "content": {
                                                "Click": {
                                                    "type": "Folder",
                                                    "content": {
                                                        "frame_0.json": "File",
                                                        "frame_1.json": "File",
                                                        "frame_2.json": "File",
                                                        "frame_3.json": "File",
                                                        "frame_4.json": "File",
                                                        "frame_5.json": "File",
                                                        "frame_6.json": "File",
                                                        "frame_7.json": "File",
                                                        "frame_8.json": "File",
                                                        "frame_9.json": "File"
                                                    }
                                                },
                                                "Click.json": "File",
                                                "Key": {
                                                    "type": "Folder",
                                                    "content": {
                                                        "frame_0.json": "File",
                                                        "frame_1.json": "File",
                                                        "frame_10.json": "File",
                                                        "frame_11.json": "File",
                                                        "frame_2.json": "File",
                                                        "frame_3.json": "File",
                                                        "frame_4.json": "File",
                                                        "frame_5.json": "File",
                                                        "frame_6.json": "File",
                                                        "frame_7.json": "File",
                                                        "frame_8.json": "File",
                                                        "frame_9.json": "File"
                                                    }
                                                },
                                                "Key.json": "File",
                                                "Properties": {
                                                    "type": "Folder",
                                                    "content": {
                                                        "frame_0.json": "File",
                                                        "frame_1.json": "File",
                                                        "frame_2.json": "File",
                                                        "frame_3.json": "File",
                                                        "frame_4.json": "File",
                                                        "frame_5.json": "File"
                                                    }
                                                },
                                                "Properties.json": "File",
                                                "SelectItemsByClick": {
                                                    "type": "Folder",
                                                    "content": {
                                                        "frame_0.json": "File",
                                                        "frame_1.json": "File",
                                                        "frame_2.json": "File",
                                                        "frame_3.json": "File",
                                                        "frame_4.json": "File",
                                                        "frame_5.json": "File",
                                                        "frame_6.json": "File",
                                                        "frame_7.json": "File",
                                                        "frame_8.json": "File",
                                                        "frame_9.json": "File"
                                                    }
                                                },
                                                "SelectItemsByClick.json": "File",
                                                "SelectItemsByKey": {
                                                    "type": "Folder",
                                                    "content": {
                                                        "frame_0.json": "File",
                                                        "frame_1.json": "File",
                                                        "frame_10.json": "File",
                                                        "frame_11.json": "File",
                                                        "frame_2.json": "File",
                                                        "frame_3.json": "File",
                                                        "frame_4.json": "File",
                                                        "frame_5.json": "File",
                                                        "frame_6.json": "File",
                                                        "frame_7.json": "File",
                                                        "frame_8.json": "File",
                                                        "frame_9.json": "File"
                                                    }
                                                },
                                                "SelectItemsByKey.json": "File"
                                            }
                                        },
                                        "SingleSelect": {
                                            "type": "Folder",
                                            "content": {
                                                "Click": {
                                                    "type": "Folder",
                                                    "content": {
                                                        "frame_0.json": "File",
                                                        "frame_1.json": "File",
                                                        "frame_2.json": "File",
                                                        "frame_3.json": "File",
                                                        "frame_4.json": "File",
                                                        "frame_5.json": "File",
                                                        "frame_6.json": "File",
                                                        "frame_7.json": "File",
                                                        "frame_8.json": "File",
                                                        "frame_9.json": "File"
                                                    }
                                                },
                                                "Click.json": "File",
                                                "Key": {
                                                    "type": "Folder",
                                                    "content": {
                                                        "frame_0.json": "File",
                                                        "frame_1.json": "File",
                                                        "frame_10.json": "File",
                                                        "frame_11.json": "File",
                                                        "frame_2.json": "File",
                                                        "frame_3.json": "File",
                                                        "frame_4.json": "File",
                                                        "frame_5.json": "File",
                                                        "frame_6.json": "File",
                                                        "frame_7.json": "File",
                                                        "frame_8.json": "File",
                                                        "frame_9.json": "File"
                                                    }
                                                },
                                                "Key.json": "File",
                                                "Properties": {
                                                    "type": "Folder",
                                                    "content": {
                                                        "frame_0.json": "File",
                                                        "frame_1.json": "File",
                                                        "frame_2.json": "File",
                                                        "frame_3.json": "File",
                                                        "frame_4.json": "File",
                                                        "frame_5.json": "File"
                                                    }
                                                },
                                                "Properties.json": "File",
                                                "SelectItemsByClick": {
                                                    "type": "Folder",
                                                    "content": {
                                                        "frame_0.json": "File",
                                                        "frame_1.json": "File",
                                                        "frame_2.json": "File",
                                                        "frame_3.json": "File",
                                                        "frame_4.json": "File",
                                                        "frame_5.json": "File",
                                                        "frame_6.json": "File",
                                                        "frame_7.json": "File",
                                                        "frame_8.json": "File",
                                                        "frame_9.json": "File"
                                                    }
                                                },
                                                "SelectItemsByClick.json": "File",
                                                "SelectItemsByKey": {
                                                    "type": "Folder",
                                                    "content": {
                                                        "frame_0.json": "File",
                                                        "frame_1.json": "File",
                                                        "frame_10.json": "File",
                                                        "frame_11.json": "File",
                                                        "frame_2.json": "File",
                                                        "frame_3.json": "File",
                                                        "frame_4.json": "File",
                                                        "frame_5.json": "File",
                                                        "frame_6.json": "File",
                                                        "frame_7.json": "File",
                                                        "frame_8.json": "File",
                                                        "frame_9.json": "File"
                                                    }
                                                },
                                                "SelectItemsByKey.json": "File"
                                            }
                                        }
                                    }
                                },
                                "GuiBindableTextList": {
                                    "type": "Folder",
                                    "content": {
                                        "MultiSelect": {
                                            "type": "Folder",
                                            "content": {
                                                "Click": {
                                                    "type": "Folder",
                                                    "content": {
                                                        "frame_0.json": "File",
                                                        "frame_1.json": "File",
                                                        "frame_2.json": "File",
                                                        "frame_3.json": "File",
                                                        "frame_4.json": "File",
                                                        "frame_5.json": "File",
                                                        "frame_6.json": "File",
                                                        "frame_7.json": "File",
                                                        "frame_8.json": "File",
                                                        "frame_9.json": "File"
                                                    }
                                                },
                                                "Click.json": "File",
                                                "Key": {
                                                    "type": "Folder",
                                                    "content": {
                                                        "frame_0.json": "File",
                                                        "frame_1.json": "File",
                                                        "frame_10.json": "File",
                                                        "frame_11.json": "File",
                                                        "frame_2.json": "File",
                                                        "frame_3.json": "File",
                                                        "frame_4.json": "File",
                                                        "frame_5.json": "File",
                                                        "frame_6.json": "File",
                                                        "frame_7.json": "File",
                                                        "frame_8.json": "File",
                                                        "frame_9.json": "File"
                                                    }
                                                },
                                                "Key.json": "File",
                                                "Properties": {
                                                    "type": "Folder",
                                                    "content": {
                                                        "frame_0.json": "File",
                                                        "frame_1.json": "File",
                                                        "frame_2.json": "File",
                                                        "frame_3.json": "File",
                                                        "frame_4.json": "File",
                                                        "frame_5.json": "File"
                                                    }
                                                },
                                                "Properties.json": "File",
                                                "SelectItemsByClick": {
                                                    "type": "Folder",
                                                    "content": {
                                                        "frame_0.json": "File",
                                                        "frame_1.json": "File",
                                                        "frame_2.json": "File",
                                                        "frame_3.json": "File",
                                                        "frame_4.json": "File",
                                                        "frame_5.json": "File",
                                                        "frame_6.json": "File",
                                                        "frame_7.json": "File",
                                                        "frame_8.json": "File",
                                                        "frame_9.json": "File"
                                                    }
                                                },
                                                "SelectItemsByClick.json": "File",
                                                "SelectItemsByKey": {
                                                    "type": "Folder",
                                                    "content": {
                                                        "frame_0.json": "File",
                                                        "frame_1.json": "File",
                                                        "frame_10.json": "File",
                                                        "frame_11.json": "File",
                                                        "frame_2.json": "File",
                                                        "frame_3.json": "File",
                                                        "frame_4.json": "File",
                                                        "frame_5.json": "File",
                                                        "frame_6.json": "File",
                                                        "frame_7.json": "File",
                                                        "frame_8.json": "File",
                                                        "frame_9.json": "File"
                                                    }
                                                },
                                                "SelectItemsByKey.json": "File"
                                            }
                                        },
                                        "SingleSelect": {
                                            "type": "Folder",
                                            "content": {
                                                "Click": {
                                                    "type": "Folder",
                                                    "content": {
                                                        "frame_0.json": "File",
                                                        "frame_1.json": "File",
                                                        "frame_2.json": "File",
                                                        "frame_3.json": "File",
                                                        "frame_4.json": "File",
                                                        "frame_5.json": "File",
                                                        "frame_6.json": "File",
                                                        "frame_7.json": "File",
                                                        "frame_8.json": "File",
                                                        "frame_9.json": "File"
                                                    }
                                                },
                                                "Click.json": "File",
                                                "Key": {
                                                    "type": "Folder",
                                                    "content": {
                                                        "frame_0.json": "File",
                                                        "frame_1.json": "File",
                                                        "frame_10.json": "File",
                                                        "frame_11.json": "File",
                                                        "frame_2.json": "File",
                                                        "frame_3.json": "File",
                                                        "frame_4.json": "File",
                                                        "frame_5.json": "File",
                                                        "frame_6.json": "File",
                                                        "frame_7.json": "File",
                                                        "frame_8.json": "File",
                                                        "frame_9.json": "File"
                                                    }
                                                },
                                                "Key.json": "File",
                                                "Properties": {
                                                    "type": "Folder",
                                                    "content": {
                                                        "frame_0.json": "File",
                                                        "frame_1.json": "File",
                                                        "frame_2.json": "File",
                                                        "frame_3.json": "File",
                                                        "frame_4.json": "File",
                                                        "frame_5.json": "File"
                                                    }
                                                },
                                                "Properties.json": "File",
                                                "SelectItemsByClick": {
                                                    "type": "Folder",
                                                    "content": {
                                                        "frame_0.json": "File",
                                                        "frame_1.json": "File",
                                                        "frame_2.json": "File",
                                                        "frame_3.json": "File",
                                                        "frame_4.json": "File",
                                                        "frame_5.json": "File",
                                                        "frame_6.json": "File",
                                                        "frame_7.json": "File",
                                                        "frame_8.json": "File",
                                                        "frame_9.json": "File"
                                                    }
                                                },
                                                "SelectItemsByClick.json": "File",
                                                "SelectItemsByKey": {
                                                    "type": "Folder",
                                                    "content": {
                                                        "frame_0.json": "File",
                                                        "frame_1.json": "File",
                                                        "frame_10.json": "File",
                                                        "frame_11.json": "File",
                                                        "frame_2.json": "File",
                                                        "frame_3.json": "File",
                                                        "frame_4.json": "File",
                                                        "frame_5.json": "File",
                                                        "frame_6.json": "File",
                                                        "frame_7.json": "File",
                                                        "frame_8.json": "File",
                                                        "frame_9.json": "File"
                                                    }
                                                },
                                                "SelectItemsByKey.json": "File"
                                            }
                                        }
                                    }
                                },
                                "GuiBindableTreeView": {
                                    "type": "Folder",
                                    "content": {
                                        "MultiSelect": {
                                            "type": "Folder",
                                            "content": {
                                                "Click": {
                                                    "type": "Folder",
                                                    "content": {
                                                        "frame_0.json": "File",
                                                        "frame_1.json": "File",
                                                        "frame_2.json": "File",
                                                        "frame_3.json": "File",
                                                        "frame_4.json": "File",
                                                        "frame_5.json": "File",
                                                        "frame_6.json": "File",
                                                        "frame_7.json": "File",
                                                        "frame_8.json": "File",
                                                        "frame_9.json": "File"
                                                    }
                                                },
                                                "Click.json": "File",
                                                "Key": {
                                                    "type": "Folder",
                                                    "content": {
                                                        "frame_0.json": "File",
                                                        "frame_1.json": "File",
                                                        "frame_10.json": "File",
                                                        "frame_11.json": "File",
                                                        "frame_2.json": "File",
                                                        "frame_3.json": "File",
                                                        "frame_4.json": "File",
                                                        "frame_5.json": "File",
                                                        "frame_6.json": "File",
                                                        "frame_7.json": "File",
                                                        "frame_8.json": "File",
                                                        "frame_9.json": "File"
                                                    }
                                                },
                                                "Key.json": "File",
                                                "Properties": {
                                                    "type": "Folder",
                                                    "content": {
                                                        "frame_0.json": "File",
                                                        "frame_1.json": "File",
                                                        "frame_2.json": "File",
                                                        "frame_3.json": "File",
                                                        "frame_4.json": "File",
                                                        "frame_5.json": "File"
                                                    }
                                                },
                                                "Properties.json": "File",
                                                "SelectItemsByClick": {
                                                    "type": "Folder",
                                                    "content": {
                                                        "frame_0.json": "File",
                                                        "frame_1.json": "File",
                                                        "frame_2.json": "File",
                                                        "frame_3.json": "File",
                                                        "frame_4.json": "File",
                                                        "frame_5.json": "File",
                                                        "frame_6.json": "File",
                                                        "frame_7.json": "File",
                                                        "frame_8.json": "File",
                                                        "frame_9.json": "File"
                                                    }
                                                },
                                                "SelectItemsByClick.json": "File",
                                                "SelectItemsByKey": {
                                                    "type": "Folder",
                                                    "content": {
                                                        "frame_0.json": "File",
                                                        "frame_1.json": "File",
                                                        "frame_10.json": "File",
                                                        "frame_11.json": "File",
                                                        "frame_2.json": "File",
                                                        "frame_3.json": "File",
                                                        "frame_4.json": "File",
                                                        "frame_5.json": "File",
                                                        "frame_6.json": "File",
                                                        "frame_7.json": "File",
                                                        "frame_8.json": "File",
                                                        "frame_9.json": "File"
                                                    }
                                                },
                                                "SelectItemsByKey.json": "File"
                                            }
                                        },
                                        "SingleSelect": {
                                            "type": "Folder",
                                            "content": {
                                                "Click": {
                                                    "type": "Folder",
                                                    "content": {
                                                        "frame_0.json": "File",
                                                        "frame_1.json": "File",
                                                        "frame_2.json": "File",
                                                        "frame_3.json": "File",
                                                        "frame_4.json": "File",
                                                        "frame_5.json": "File",
                                                        "frame_6.json": "File",
                                                        "frame_7.json": "File",
                                                        "frame_8.json": "File",
                                                        "frame_9.json": "File"
                                                    }
                                                },
                                                "Click.json": "File",
                                                "Key": {
                                                    "type": "Folder",
                                                    "content": {
                                                        "frame_0.json": "File",
                                                        "frame_1.json": "File",
                                                        "frame_10.json": "File",
                                                        "frame_11.json": "File",
                                                        "frame_2.json": "File",
                                                        "frame_3.json": "File",
                                                        "frame_4.json": "File",
                                                        "frame_5.json": "File",
                                                        "frame_6.json": "File",
                                                        "frame_7.json": "File",
                                                        "frame_8.json": "File",
                                                        "frame_9.json": "File"
                                                    }
                                                },
                                                "Key.json": "File",
                                                "Properties": {
                                                    "type": "Folder",
                                                    "content": {
                                                        "frame_0.json": "File",
                                                        "frame_1.json": "File",
                                                        "frame_2.json": "File",
                                                        "frame_3.json": "File",
                                                        "frame_4.json": "File",
                                                        "frame_5.json": "File"
                                                    }
                                                },
                                                "Properties.json": "File",
                                                "SelectItemsByClick": {
                                                    "type": "Folder",
                                                    "content": {
                                                        "frame_0.json": "File",
                                                        "frame_1.json": "File",
                                                        "frame_2.json": "File",
                                                        "frame_3.json": "File",
                                                        "frame_4.json": "File",
                                                        "frame_5.json": "File",
                                                        "frame_6.json": "File",
                                                        "frame_7.json": "File",
                                                        "frame_8.json": "File",
                                                        "frame_9.json": "File"
                                                    }
                                                },
                                                "SelectItemsByClick.json": "File",
                                                "SelectItemsByKey": {
                                                    "type": "Folder",
                                                    "content": {
                                                        "frame_0.json": "File",
                                                        "frame_1.json": "File",
                                                        "frame_10.json": "File",
                                                        "frame_11.json": "File",
                                                        "frame_2.json": "File",
                                                        "frame_3.json": "File",
                                                        "frame_4.json": "File",
                                                        "frame_5.json": "File",
                                                        "frame_6.json": "File",
                                                        "frame_7.json": "File",
                                                        "frame_8.json": "File",
                                                        "frame_9.json": "File"
                                                    }
                                                },
                                                "SelectItemsByKey.json": "File"
                                            }
                                        }
                                    }
                                },
                                "GuiListView": {
                                    "type": "Folder",
                                    "content": {
                                        "MultiSelect": {
                                            "type": "Folder",
                                            "content": {
                                                "Click": {
                                                    "type": "Folder",
                                                    "content": {
                                                        "frame_0.json": "File",
                                                        "frame_1.json": "File",
                                                        "frame_2.json": "File",
                                                        "frame_3.json": "File",
                                                        "frame_4.json": "File",
                                                        "frame_5.json": "File",
                                                        "frame_6.json": "File",
                                                        "frame_7.json": "File",
                                                        "frame_8.json": "File",
                                                        "frame_9.json": "File"
                                                    }
                                                },
                                                "Click.json": "File",
                                                "Key": {
                                                    "type": "Folder",
                                                    "content": {
                                                        "frame_0.json": "File",
                                                        "frame_1.json": "File",
                                                        "frame_10.json": "File",
                                                        "frame_11.json": "File",
                                                        "frame_2.json": "File",
                                                        "frame_3.json": "File",
                                                        "frame_4.json": "File",
                                                        "frame_5.json": "File",
                                                        "frame_6.json": "File",
                                                        "frame_7.json": "File",
                                                        "frame_8.json": "File",
                                                        "frame_9.json": "File"
                                                    }
                                                },
                                                "Key.json": "File",
                                                "Properties": {
                                                    "type": "Folder",
                                                    "content": {
                                                        "frame_0.json": "File",
                                                        "frame_1.json": "File",
                                                        "frame_2.json": "File",
                                                        "frame_3.json": "File",
                                                        "frame_4.json": "File",
                                                        "frame_5.json": "File"
                                                    }
                                                },
                                                "Properties.json": "File",
                                                "SelectItemsByClick": {
                                                    "type": "Folder",
                                                    "content": {
                                                        "frame_0.json": "File",
                                                        "frame_1.json": "File",
                                                        "frame_2.json": "File",
                                                        "frame_3.json": "File",
                                                        "frame_4.json": "File",
                                                        "frame_5.json": "File",
                                                        "frame_6.json": "File",
                                                        "frame_7.json": "File",
                                                        "frame_8.json": "File",
                                                        "frame_9.json": "File"
                                                    }
                                                },
                                                "SelectItemsByClick.json": "File",
                                                "SelectItemsByKey": {
                                                    "type": "Folder",
                                                    "content": {
                                                        "frame_0.json": "File",
                                                        "frame_1.json": "File",
                                                        "frame_10.json": "File",
                                                        "frame_11.json": "File",
                                                        "frame_2.json": "File",
                                                        "frame_3.json": "File",
                                                        "frame_4.json": "File",
                                                        "frame_5.json": "File",
                                                        "frame_6.json": "File",
                                                        "frame_7.json": "File",
                                                        "frame_8.json": "File",
                                                        "frame_9.json": "File"
                                                    }
                                                },
                                                "SelectItemsByKey.json": "File"
                                            }
                                        },
                                        "SingleSelect": {
                                            "type": "Folder",
                                            "content": {
                                                "Click": {
                                                    "type": "Folder",
                                                    "content": {
                                                        "frame_0.json": "File",
                                                        "frame_1.json": "File",
                                                        "frame_2.json": "File",
                                                        "frame_3.json": "File",
                                                        "frame_4.json": "File",
                                                        "frame_5.json": "File",
                                                        "frame_6.json": "File",
                                                        "frame_7.json": "File",
                                                        "frame_8.json": "File",
                                                        "frame_9.json": "File"
                                                    }
                                                },
                                                "Click.json": "File",
                                                "Key": {
                                                    "type": "Folder",
                                                    "content": {
                                                        "frame_0.json": "File",
                                                        "frame_1.json": "File",
                                                        "frame_10.json": "File",
                                                        "frame_11.json": "File",
                                                        "frame_2.json": "File",
                                                        "frame_3.json": "File",
                                                        "frame_4.json": "File",
                                                        "frame_5.json": "File",
                                                        "frame_6.json": "File",
                                                        "frame_7.json": "File",
                                                        "frame_8.json": "File",
                                                        "frame_9.json": "File"
                                                    }
                                                },
                                                "Key.json": "File",
                                                "Properties": {
                                                    "type": "Folder",
                                                    "content": {
                                                        "frame_0.json": "File",
                                                        "frame_1.json": "File",
                                                        "frame_2.json": "File",
                                                        "frame_3.json": "File",
                                                        "frame_4.json": "File",
                                                        "frame_5.json": "File"
                                                    }
                                                },
                                                "Properties.json": "File",
                                                "SelectItemsByClick": {
                                                    "type": "Folder",
                                                    "content": {
                                                        "frame_0.json": "File",
                                                        "frame_1.json": "File",
                                                        "frame_2.json": "File",
                                                        "frame_3.json": "File",
                                                        "frame_4.json": "File",
                                                        "frame_5.json": "File",
                                                        "frame_6.json": "File",
                                                        "frame_7.json": "File",
                                                        "frame_8.json": "File",
                                                        "frame_9.json": "File"
                                                    }
                                                },
                                                "SelectItemsByClick.json": "File",
                                                "SelectItemsByKey": {
                                                    "type": "Folder",
                                                    "content": {
                                                        "frame_0.json": "File",
                                                        "frame_1.json": "File",
                                                        "frame_10.json": "File",
                                                        "frame_11.json": "File",
                                                        "frame_2.json": "File",
                                                        "frame_3.json": "File",
                                                        "frame_4.json": "File",
                                                        "frame_5.json": "File",
                                                        "frame_6.json": "File",
                                                        "frame_7.json": "File",
                                                        "frame_8.json": "File",
                                                        "frame_9.json": "File"
                                                    }
                                                },
                                                "SelectItemsByKey.json": "File"
                                            }
                                        }
                                    }
                                },
                                "GuiTextList": {
                                    "type": "Folder",
                                    "content": {
                                        "MultiSelect": {
                                            "type": "Folder",
                                            "content": {
                                                "Click": {
                                                    "type": "Folder",
                                                    "content": {
                                                        "frame_0.json": "File",
                                                        "frame_1.json": "File",
                                                        "frame_2.json": "File",
                                                        "frame_3.json": "File",
                                                        "frame_4.json": "File",
                                                        "frame_5.json": "File",
                                                        "frame_6.json": "File",
                                                        "frame_7.json": "File",
                                                        "frame_8.json": "File",
                                                        "frame_9.json": "File"
                                                    }
                                                },
                                                "Click.json": "File",
                                                "Key": {
                                                    "type": "Folder",
                                                    "content": {
                                                        "frame_0.json": "File",
                                                        "frame_1.json": "File",
                                                        "frame_10.json": "File",
                                                        "frame_11.json": "File",
                                                        "frame_2.json": "File",
                                                        "frame_3.json": "File",
                                                        "frame_4.json": "File",
                                                        "frame_5.json": "File",
                                                        "frame_6.json": "File",
                                                        "frame_7.json": "File",
                                                        "frame_8.json": "File",
                                                        "frame_9.json": "File"
                                                    }
                                                },
                                                "Key.json": "File",
                                                "Properties": {
                                                    "type": "Folder",
                                                    "content": {
                                                        "frame_0.json": "File",
                                                        "frame_1.json": "File",
                                                        "frame_2.json": "File",
                                                        "frame_3.json": "File",
                                                        "frame_4.json": "File",
                                                        "frame_5.json": "File"
                                                    }
                                                },
                                                "Properties.json": "File",
                                                "SelectItemsByClick": {
                                                    "type": "Folder",
                                                    "content": {
                                                        "frame_0.json": "File",
                                                        "frame_1.json": "File",
                                                        "frame_2.json": "File",
                                                        "frame_3.json": "File",
                                                        "frame_4.json": "File",
                                                        "frame_5.json": "File",
                                                        "frame_6.json": "File",
                                                        "frame_7.json": "File",
                                                        "frame_8.json": "File",
                                                        "frame_9.json": "File"
                                                    }
                                                },
                                                "SelectItemsByClick.json": "File",
                                                "SelectItemsByKey": {
                                                    "type": "Folder",
                                                    "content": {
                                                        "frame_0.json": "File",
                                                        "frame_1.json": "File",
                                                        "frame_10.json": "File",
                                                        "frame_11.json": "File",
                                                        "frame_2.json": "File",
                                                        "frame_3.json": "File",
                                                        "frame_4.json": "File",
                                                        "frame_5.json": "File",
                                                        "frame_6.json": "File",
                                                        "frame_7.json": "File",
                                                        "frame_8.json": "File",
                                                        "frame_9.json": "File"
                                                    }
                                                },
                                                "SelectItemsByKey.json": "File"
                                            }
                                        },
                                        "SingleSelect": {
                                            "type": "Folder",
                                            "content": {
                                                "Click": {
                                                    "type": "Folder",
                                                    "content": {
                                                        "frame_0.json": "File",
                                                        "frame_1.json": "File",
                                                        "frame_2.json": "File",
                                                        "frame_3.json": "File",
                                                        "frame_4.json": "File",
                                                        "frame_5.json": "File",
                                                        "frame_6.json": "File",
                                                        "frame_7.json": "File",
                                                        "frame_8.json": "File",
                                                        "frame_9.json": "File"
                                                    }
                                                },
                                                "Click.json": "File",
                                                "Key": {
                                                    "type": "Folder",
                                                    "content": {
                                                        "frame_0.json": "File",
                                                        "frame_1.json": "File",
                                                        "frame_10.json": "File",
                                                        "frame_11.json": "File",
                                                        "frame_2.json": "File",
                                                        "frame_3.json": "File",
                                                        "frame_4.json": "File",
                                                        "frame_5.json": "File",
                                                        "frame_6.json": "File",
                                                        "frame_7.json": "File",
                                                        "frame_8.json": "File",
                                                        "frame_9.json": "File"
                                                    }
                                                },
                                                "Key.json": "File",
                                                "Properties": {
                                                    "type": "Folder",
                                                    "content": {
                                                        "frame_0.json": "File",
                                                        "frame_1.json": "File",
                                                        "frame_2.json": "File",
                                                        "frame_3.json": "File",
                                                        "frame_4.json": "File",
                                                        "frame_5.json": "File"
                                                    }
                                                },
                                                "Properties.json": "File",
                                                "SelectItemsByClick": {
                                                    "type": "Folder",
                                                    "content": {
                                                        "frame_0.json": "File",
                                                        "frame_1.json": "File",
                                                        "frame_2.json": "File",
                                                        "frame_3.json": "File",
                                                        "frame_4.json": "File",
                                                        "frame_5.json": "File",
                                                        "frame_6.json": "File",
                                                        "frame_7.json": "File",
                                                        "frame_8.json": "File",
                                                        "frame_9.json": "File"
                                                    }
                                                },
                                                "SelectItemsByClick.json": "File",
                                                "SelectItemsByKey": {
                                                    "type": "Folder",
                                                    "content": {
                                                        "frame_0.json": "File",
                                                        "frame_1.json": "File",
                                                        "frame_10.json": "File",
                                                        "frame_11.json": "File",
                                                        "frame_2.json": "File",
                                                        "frame_3.json": "File",
                                                        "frame_4.json": "File",
                                                        "frame_5.json": "File",
                                                        "frame_6.json": "File",
                                                        "frame_7.json": "File",
                                                        "frame_8.json": "File",
                                                        "frame_9.json": "File"
                                                    }
                                                },
                                                "SelectItemsByKey.json": "File"
                                            }
                                        }
                                    }
                                },
                                "GuiTreeView": {
                                    "type": "Folder",
                                    "content": {
                                        "MultiSelect": {
                                            "type": "Folder",
                                            "content": {
                                                "Click": {
                                                    "type": "Folder",
                                                    "content": {
                                                        "frame_0.json": "File",
                                                        "frame_1.json": "File",
                                                        "frame_2.json": "File",
                                                        "frame_3.json": "File",
                                                        "frame_4.json": "File",
                                                        "frame_5.json": "File",
                                                        "frame_6.json": "File",
                                                        "frame_7.json": "File",
                                                        "frame_8.json": "File",
                                                        "frame_9.json": "File"
                                                    }
                                                },
                                                "Click.json": "File",
                                                "Key": {
                                                    "type": "Folder",
                                                    "content": {
                                                        "frame_0.json": "File",
                                                        "frame_1.json": "File",
                                                        "frame_10.json": "File",
                                                        "frame_11.json": "File",
                                                        "frame_2.json": "File",
                                                        "frame_3.json": "File",
                                                        "frame_4.json": "File",
                                                        "frame_5.json": "File",
                                                        "frame_6.json": "File",
                                                        "frame_7.json": "File",
                                                        "frame_8.json": "File",
                                                        "frame_9.json": "File"
                                                    }
                                                },
                                                "Key.json": "File",
                                                "Properties": {
                                                    "type": "Folder",
                                                    "content": {
                                                        "frame_0.json": "File",
                                                        "frame_1.json": "File",
                                                        "frame_2.json": "File",
                                                        "frame_3.json": "File",
                                                        "frame_4.json": "File",
                                                        "frame_5.json": "File"
                                                    }
                                                },
                                                "Properties.json": "File",
                                                "SelectItemsByClick": {
                                                    "type": "Folder",
                                                    "content": {
                                                        "frame_0.json": "File",
                                                        "frame_1.json": "File",
                                                        "frame_2.json": "File",
                                                        "frame_3.json": "File",
                                                        "frame_4.json": "File",
                                                        "frame_5.json": "File",
                                                        "frame_6.json": "File",
                                                        "frame_7.json": "File",
                                                        "frame_8.json": "File",
                                                        "frame_9.json": "File"
                                                    }
                                                },
                                                "SelectItemsByClick.json": "File",
                                                "SelectItemsByKey": {
                                                    "type": "Folder",
                                                    "content": {
                                                        "frame_0.json": "File",
                                                        "frame_1.json": "File",
                                                        "frame_10.json": "File",
                                                        "frame_11.json": "File",
                                                        "frame_2.json": "File",
                                                        "frame_3.json": "File",
                                                        "frame_4.json": "File",
                                                        "frame_5.json": "File",
                                                        "frame_6.json": "File",
                                                        "frame_7.json": "File",
                                                        "frame_8.json": "File",
                                                        "frame_9.json": "File"
                                                    }
                                                },
                                                "SelectItemsByKey.json": "File"
                                            }
                                        },
                                        "SingleSelect": {
                                            "type": "Folder",
                                            "content": {
                                                "Click": {
                                                    "type": "Folder",
                                                    "content": {
                                                        "frame_0.json": "File",
                                                        "frame_1.json": "File",
                                                        "frame_2.json": "File",
                                                        "frame_3.json": "File",
                                                        "frame_4.json": "File",
                                                        "frame_5.json": "File",
                                                        "frame_6.json": "File",
                                                        "frame_7.json": "File",
                                                        "frame_8.json": "File",
                                                        "frame_9.json": "File"
                                                    }
                                                },
                                                "Click.json": "File",
                                                "Key": {
                                                    "type": "Folder",
                                                    "content": {
                                                        "frame_0.json": "File",
                                                        "frame_1.json": "File",
                                                        "frame_10.json": "File",
                                                        "frame_11.json": "File",
                                                        "frame_2.json": "File",
                                                        "frame_3.json": "File",
                                                        "frame_4.json": "File",
                                                        "frame_5.json": "File",
                                                        "frame_6.json": "File",
                                                        "frame_7.json": "File",
                                                        "frame_8.json": "File",
                                                        "frame_9.json": "File"
                                                    }
                                                },
                                                "Key.json": "File",
                                                "Properties": {
                                                    "type": "Folder",
                                                    "content": {
                                                        "frame_0.json": "File",
                                                        "frame_1.json": "File",
                                                        "frame_2.json": "File",
                                                        "frame_3.json": "File",
                                                        "frame_4.json": "File",
                                                        "frame_5.json": "File"
                                                    }
                                                },
                                                "Properties.json": "File",
                                                "SelectItemsByClick": {
                                                    "type": "Folder",
                                                    "content": {
                                                        "frame_0.json": "File",
                                                        "frame_1.json": "File",
                                                        "frame_2.json": "File",
                                                        "frame_3.json": "File",
                                                        "frame_4.json": "File",
                                                        "frame_5.json": "File",
                                                        "frame_6.json": "File",
                                                        "frame_7.json": "File",
                                                        "frame_8.json": "File",
                                                        "frame_9.json": "File"
                                                    }
                                                },
                                                "SelectItemsByClick.json": "File",
                                                "SelectItemsByKey": {
                                                    "type": "Folder",
                                                    "content": {
                                                        "frame_0.json": "File",
                                                        "frame_1.json": "File",
                                                        "frame_10.json": "File",
                                                        "frame_11.json": "File",
                                                        "frame_2.json": "File",
                                                        "frame_3.json": "File",
                                                        "frame_4.json": "File",
                                                        "frame_5.json": "File",
                                                        "frame_6.json": "File",
                                                        "frame_7.json": "File",
                                                        "frame_8.json": "File",
                                                        "frame_9.json": "File"
                                                    }
                                                },
                                                "SelectItemsByKey.json": "File"
                                            }
                                        }
                                    }
                                }
                            }
                        },
                        "GuiTextList": {
                            "type": "Folder",
                            "content": {
                                "CheckItemsByKey": {
                                    "type": "Folder",
                                    "content": {
                                        "frame_0.json": "File",
                                        "frame_1.json": "File",
                                        "frame_10.json": "File",
                                        "frame_2.json": "File",
                                        "frame_3.json": "File",
                                        "frame_4.json": "File",
                                        "frame_5.json": "File",
                                        "frame_6.json": "File",
                                        "frame_7.json": "File",
                                        "frame_8.json": "File",
                                        "frame_9.json": "File"
                                    }
                                },
                                "CheckItemsByKey.json": "File",
                                "ClickVisibleItems": {
                                    "type": "Folder",
                                    "content": {
                                        "frame_0.json": "File",
                                        "frame_1.json": "File",
                                        "frame_2.json": "File",
                                        "frame_3.json": "File",
                                        "frame_4.json": "File"
                                    }
                                },
                                "ClickVisibleItems.json": "File",
                                "GuiTextListItemTemplate": {
                                    "type": "Folder",
                                    "content": {
                                        "ClickVisibleItems": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File"
                                            }
                                        },
                                        "ClickVisibleItems.json": "File",
                                        "UpdateInvisibleItems": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File"
                                            }
                                        },
                                        "UpdateInvisibleItems.json": "File",
                                        "UpdateVisibleItems": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File",
                                                "frame_5.json": "File"
                                            }
                                        },
                                        "UpdateVisibleItems.json": "File"
                                    }
                                },
                                "MakeInvisibleItems": {
                                    "type": "Folder",
                                    "content": {
                                        "frame_0.json": "File",
                                        "frame_1.json": "File",
                                        "frame_10.json": "File",
                                        "frame_11.json": "File",
                                        "frame_2.json": "File",
                                        "frame_3.json": "File",
                                        "frame_4.json": "File",
                                        "frame_5.json": "File",
                                        "frame_6.json": "File",
                                        "frame_7.json": "File",
                                        "frame_8.json": "File",
                                        "frame_9.json": "File"
                                    }
                                },
                                "MakeInvisibleItems.json": "File",
                                "MakeVisibleItems": {
                                    "type": "Folder",
                                    "content": {
                                        "frame_0.json": "File",
                                        "frame_1.json": "File",
                                        "frame_2.json": "File",
                                        "frame_3.json": "File",
                                        "frame_4.json": "File",
                                        "frame_5.json": "File",
                                        "frame_6.json": "File",
                                        "frame_7.json": "File"
                                    }
                                },
                                "MakeVisibleItems.json": "File",
                                "UpdateInvisibleItems": {
                                    "type": "Folder",
                                    "content": {
                                        "frame_0.json": "File",
                                        "frame_1.json": "File",
                                        "frame_2.json": "File",
                                        "frame_3.json": "File",
                                        "frame_4.json": "File"
                                    }
                                },
                                "UpdateInvisibleItems.json": "File",
                                "UpdateVisibleItems": {
                                    "type": "Folder",
                                    "content": {
                                        "frame_0.json": "File",
                                        "frame_1.json": "File",
                                        "frame_2.json": "File",
                                        "frame_3.json": "File",
                                        "frame_4.json": "File",
                                        "frame_5.json": "File"
                                    }
                                },
                                "UpdateVisibleItems.json": "File"
                            }
                        },
                        "GuiTreeItemTemplate": {
                            "type": "Folder",
                            "content": {
                                "GuiBindableTreeView": {
                                    "type": "Folder",
                                    "content": {
                                        "ClickAndExpandCollapseItems": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File",
                                                "frame_5.json": "File",
                                                "frame_6.json": "File",
                                                "frame_7.json": "File"
                                            }
                                        },
                                        "ClickAndExpandCollapseItems.json": "File",
                                        "Context": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File"
                                            }
                                        },
                                        "Context.json": "File",
                                        "DBClickAndExpandCollapseItems": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File",
                                                "frame_5.json": "File",
                                                "frame_6.json": "File",
                                                "frame_7.json": "File"
                                            }
                                        },
                                        "DBClickAndExpandCollapseItems.json": "File",
                                        "DisplayItemBackground": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File",
                                                "frame_5.json": "File",
                                                "frame_6.json": "File"
                                            }
                                        },
                                        "DisplayItemBackground.json": "File",
                                        "Font": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File",
                                                "frame_5.json": "File"
                                            }
                                        },
                                        "Font.json": "File",
                                        "Image": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File"
                                            }
                                        },
                                        "Image.json": "File",
                                        "KeyAndExpandCollapseItems": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File",
                                                "frame_5.json": "File",
                                                "frame_6.json": "File",
                                                "frame_7.json": "File"
                                            }
                                        },
                                        "KeyAndExpandCollapseItems.json": "File",
                                        "MouseVisualEffect": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File",
                                                "frame_5.json": "File",
                                                "frame_6.json": "File"
                                            }
                                        },
                                        "MouseVisualEffect.json": "File",
                                        "UpdateInvisibleChildItems": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File",
                                                "frame_5.json": "File"
                                            }
                                        },
                                        "UpdateInvisibleChildItems.json": "File",
                                        "UpdateInvisibleItems": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File"
                                            }
                                        },
                                        "UpdateInvisibleItems.json": "File",
                                        "UpdateVisibleChildItems": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File"
                                            }
                                        },
                                        "UpdateVisibleChildItems.json": "File",
                                        "UpdateVisibleItems": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File"
                                            }
                                        },
                                        "UpdateVisibleItems.json": "File"
                                    }
                                },
                                "GuiTreeView": {
                                    "type": "Folder",
                                    "content": {
                                        "ClickAndExpandCollapseItems": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File",
                                                "frame_5.json": "File",
                                                "frame_6.json": "File",
                                                "frame_7.json": "File"
                                            }
                                        },
                                        "ClickAndExpandCollapseItems.json": "File",
                                        "Context": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File"
                                            }
                                        },
                                        "Context.json": "File",
                                        "DBClickAndExpandCollapseItems": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File",
                                                "frame_5.json": "File",
                                                "frame_6.json": "File",
                                                "frame_7.json": "File"
                                            }
                                        },
                                        "DBClickAndExpandCollapseItems.json": "File",
                                        "DisplayItemBackground": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File",
                                                "frame_5.json": "File",
                                                "frame_6.json": "File"
                                            }
                                        },
                                        "DisplayItemBackground.json": "File",
                                        "Font": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File",
                                                "frame_5.json": "File"
                                            }
                                        },
                                        "Font.json": "File",
                                        "Image": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File"
                                            }
                                        },
                                        "Image.json": "File",
                                        "KeyAndExpandCollapseItems": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File",
                                                "frame_5.json": "File",
                                                "frame_6.json": "File",
                                                "frame_7.json": "File"
                                            }
                                        },
                                        "KeyAndExpandCollapseItems.json": "File",
                                        "MouseVisualEffect": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File",
                                                "frame_5.json": "File",
                                                "frame_6.json": "File"
                                            }
                                        },
                                        "MouseVisualEffect.json": "File",
                                        "UpdateInvisibleChildItems": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File",
                                                "frame_5.json": "File"
                                            }
                                        },
                                        "UpdateInvisibleChildItems.json": "File",
                                        "UpdateInvisibleItems": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File"
                                            }
                                        },
                                        "UpdateInvisibleItems.json": "File",
                                        "UpdateVisibleChildItems": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File"
                                            }
                                        },
                                        "UpdateVisibleChildItems.json": "File",
                                        "UpdateVisibleItems": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File"
                                            }
                                        },
                                        "UpdateVisibleItems.json": "File"
                                    }
                                }
                            }
                        },
                        "GuiTreeView": {
                            "type": "Folder",
                            "content": {
                                "ClickAndExpandCollapseItems": {
                                    "type": "Folder",
                                    "content": {
                                        "frame_0.json": "File",
                                        "frame_1.json": "File",
                                        "frame_2.json": "File",
                                        "frame_3.json": "File",
                                        "frame_4.json": "File",
                                        "frame_5.json": "File",
                                        "frame_6.json": "File",
                                        "frame_7.json": "File"
                                    }
                                },
                                "ClickAndExpandCollapseItems.json": "File",
                                "DBClickAndExpandCollapseItems": {
                                    "type": "Folder",
                                    "content": {
                                        "frame_0.json": "File",
                                        "frame_1.json": "File",
                                        "frame_2.json": "File",
                                        "frame_3.json": "File",
                                        "frame_4.json": "File",
                                        "frame_5.json": "File",
                                        "frame_6.json": "File",
                                        "frame_7.json": "File"
                                    }
                                },
                                "DBClickAndExpandCollapseItems.json": "File",
                                "Image": {
                                    "type": "Folder",
                                    "content": {
                                        "frame_0.json": "File",
                                        "frame_1.json": "File"
                                    }
                                },
                                "Image.json": "File",
                                "KeyAndExpandCollapseItems": {
                                    "type": "Folder",
                                    "content": {
                                        "frame_0.json": "File",
                                        "frame_1.json": "File",
                                        "frame_2.json": "File",
                                        "frame_3.json": "File",
                                        "frame_4.json": "File",
                                        "frame_5.json": "File",
                                        "frame_6.json": "File",
                                        "frame_7.json": "File"
                                    }
                                },
                                "KeyAndExpandCollapseItems.json": "File",
                                "MakeInvisibleChildItems": {
                                    "type": "Folder",
                                    "content": {
                                        "frame_0.json": "File",
                                        "frame_1.json": "File",
                                        "frame_2.json": "File",
                                        "frame_3.json": "File",
                                        "frame_4.json": "File"
                                    }
                                },
                                "MakeInvisibleChildItems.json": "File",
                                "MakeInvisibleItems": {
                                    "type": "Folder",
                                    "content": {
                                        "frame_0.json": "File",
                                        "frame_1.json": "File",
                                        "frame_10.json": "File",
                                        "frame_11.json": "File",
                                        "frame_2.json": "File",
                                        "frame_3.json": "File",
                                        "frame_4.json": "File",
                                        "frame_5.json": "File",
                                        "frame_6.json": "File",
                                        "frame_7.json": "File",
                                        "frame_8.json": "File",
                                        "frame_9.json": "File"
                                    }
                                },
                                "MakeInvisibleItems.json": "File",
                                "MakeVisibleChildItems": {
                                    "type": "Folder",
                                    "content": {
                                        "frame_0.json": "File",
                                        "frame_1.json": "File",
                                        "frame_2.json": "File",
                                        "frame_3.json": "File",
                                        "frame_4.json": "File",
                                        "frame_5.json": "File",
                                        "frame_6.json": "File",
                                        "frame_7.json": "File"
                                    }
                                },
                                "MakeVisibleChildItems.json": "File",
                                "MakeVisibleItems": {
                                    "type": "Folder",
                                    "content": {
                                        "frame_0.json": "File",
                                        "frame_1.json": "File",
                                        "frame_2.json": "File",
                                        "frame_3.json": "File",
                                        "frame_4.json": "File",
                                        "frame_5.json": "File",
                                        "frame_6.json": "File",
                                        "frame_7.json": "File"
                                    }
                                },
                                "MakeVisibleItems.json": "File",
                                "UpdateInvisibleChildItems": {
                                    "type": "Folder",
                                    "content": {
                                        "frame_0.json": "File",
                                        "frame_1.json": "File",
                                        "frame_2.json": "File",
                                        "frame_3.json": "File",
                                        "frame_4.json": "File",
                                        "frame_5.json": "File"
                                    }
                                },
                                "UpdateInvisibleChildItems.json": "File",
                                "UpdateInvisibleItems": {
                                    "type": "Folder",
                                    "content": {
                                        "frame_0.json": "File",
                                        "frame_1.json": "File",
                                        "frame_2.json": "File",
                                        "frame_3.json": "File",
                                        "frame_4.json": "File"
                                    }
                                },
                                "UpdateInvisibleItems.json": "File",
                                "UpdateVisibleChildItems": {
                                    "type": "Folder",
                                    "content": {
                                        "frame_0.json": "File",
                                        "frame_1.json": "File",
                                        "frame_2.json": "File",
                                        "frame_3.json": "File",
                                        "frame_4.json": "File"
                                    }
                                },
                                "UpdateVisibleChildItems.json": "File",
                                "UpdateVisibleItems": {
                                    "type": "Folder",
                                    "content": {
                                        "frame_0.json": "File",
                                        "frame_1.json": "File",
                                        "frame_2.json": "File",
                                        "frame_3.json": "File",
                                        "frame_4.json": "File"
                                    }
                                },
                                "UpdateVisibleItems.json": "File"
                            }
                        },
                        "GuiVirtualTreeListControl": {
                            "type": "Folder",
                            "content": {
                                "GuiBindableTreeView": {
                                    "type": "Folder",
                                    "content": {
                                        "LeftMouseEvents": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File",
                                                "frame_5.json": "File",
                                                "frame_6.json": "File",
                                                "frame_7.json": "File"
                                            }
                                        },
                                        "LeftMouseEvents.json": "File",
                                        "MiddleMouseEvents": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File",
                                                "frame_5.json": "File",
                                                "frame_6.json": "File",
                                                "frame_7.json": "File"
                                            }
                                        },
                                        "MiddleMouseEvents.json": "File",
                                        "RightMouseEvents": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File",
                                                "frame_5.json": "File",
                                                "frame_6.json": "File",
                                                "frame_7.json": "File"
                                            }
                                        },
                                        "RightMouseEvents.json": "File"
                                    }
                                },
                                "GuiTreeView": {
                                    "type": "Folder",
                                    "content": {
                                        "LeftMouseEvents": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File",
                                                "frame_5.json": "File",
                                                "frame_6.json": "File",
                                                "frame_7.json": "File"
                                            }
                                        },
                                        "LeftMouseEvents.json": "File",
                                        "MiddleMouseEvents": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File",
                                                "frame_5.json": "File",
                                                "frame_6.json": "File",
                                                "frame_7.json": "File"
                                            }
                                        },
                                        "MiddleMouseEvents.json": "File",
                                        "RightMouseEvents": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File",
                                                "frame_5.json": "File",
                                                "frame_6.json": "File",
                                                "frame_7.json": "File"
                                            }
                                        },
                                        "RightMouseEvents.json": "File"
                                    }
                                }
                            }
                        }
                    }
                },
                "Ribbon": {
                    "type": "Folder",
                    "content": {
                        "GuiBindableRibbonGalleryList": {
                            "type": "Folder",
                            "content": {
                                "Dropdown": {
                                    "type": "Folder",
                                    "content": {
                                        "frame_0.json": "File",
                                        "frame_1.json": "File",
                                        "frame_2.json": "File",
                                        "frame_3.json": "File"
                                    }
                                },
                                "Dropdown.json": "File",
                                "ReactiveView": {
                                    "type": "Folder",
                                    "content": {
                                        "frame_0.json": "File",
                                        "frame_1.json": "File",
                                        "frame_10.json": "File",
                                        "frame_11.json": "File",
                                        "frame_2.json": "File",
                                        "frame_3.json": "File",
                                        "frame_4.json": "File",
                                        "frame_5.json": "File",
                                        "frame_6.json": "File",
                                        "frame_7.json": "File",
                                        "frame_8.json": "File",
                                        "frame_9.json": "File"
                                    }
                                },
                                "ReactiveView.json": "File"
                            }
                        },
                        "GuiRibbonButtons": {
                            "type": "Folder",
                            "content": {
                                "Dropdowns": {
                                    "type": "Folder",
                                    "content": {
                                        "frame_0.json": "File",
                                        "frame_1.json": "File",
                                        "frame_10.json": "File",
                                        "frame_11.json": "File",
                                        "frame_12.json": "File",
                                        "frame_13.json": "File",
                                        "frame_14.json": "File",
                                        "frame_15.json": "File",
                                        "frame_16.json": "File",
                                        "frame_17.json": "File",
                                        "frame_18.json": "File",
                                        "frame_19.json": "File",
                                        "frame_2.json": "File",
                                        "frame_20.json": "File",
                                        "frame_21.json": "File",
                                        "frame_22.json": "File",
                                        "frame_23.json": "File",
                                        "frame_24.json": "File",
                                        "frame_25.json": "File",
                                        "frame_26.json": "File",
                                        "frame_27.json": "File",
                                        "frame_28.json": "File",
                                        "frame_29.json": "File",
                                        "frame_3.json": "File",
                                        "frame_30.json": "File",
                                        "frame_31.json": "File",
                                        "frame_32.json": "File",
                                        "frame_33.json": "File",
                                        "frame_34.json": "File",
                                        "frame_35.json": "File",
                                        "frame_36.json": "File",
                                        "frame_37.json": "File",
                                        "frame_38.json": "File",
                                        "frame_39.json": "File",
                                        "frame_4.json": "File",
                                        "frame_40.json": "File",
                                        "frame_41.json": "File",
                                        "frame_42.json": "File",
                                        "frame_43.json": "File",
                                        "frame_44.json": "File",
                                        "frame_45.json": "File",
                                        "frame_46.json": "File",
                                        "frame_47.json": "File",
                                        "frame_48.json": "File",
                                        "frame_49.json": "File",
                                        "frame_5.json": "File",
                                        "frame_50.json": "File",
                                        "frame_51.json": "File",
                                        "frame_52.json": "File",
                                        "frame_53.json": "File",
                                        "frame_54.json": "File",
                                        "frame_55.json": "File",
                                        "frame_6.json": "File",
                                        "frame_7.json": "File",
                                        "frame_8.json": "File",
                                        "frame_9.json": "File"
                                    }
                                },
                                "Dropdowns.json": "File",
                                "IconLabels": {
                                    "type": "Folder",
                                    "content": {
                                        "frame_0.json": "File",
                                        "frame_1.json": "File",
                                        "frame_2.json": "File",
                                        "frame_3.json": "File",
                                        "frame_4.json": "File",
                                        "frame_5.json": "File",
                                        "frame_6.json": "File",
                                        "frame_7.json": "File",
                                        "frame_8.json": "File",
                                        "frame_9.json": "File"
                                    }
                                },
                                "IconLabels.json": "File",
                                "ReactiveView": {
                                    "type": "Folder",
                                    "content": {
                                        "frame_0.json": "File",
                                        "frame_1.json": "File",
                                        "frame_2.json": "File",
                                        "frame_3.json": "File",
                                        "frame_4.json": "File",
                                        "frame_5.json": "File",
                                        "frame_6.json": "File",
                                        "frame_7.json": "File",
                                        "frame_8.json": "File"
                                    }
                                },
                                "ReactiveView.json": "File",
                                "Toolstrips": {
                                    "type": "Folder",
                                    "content": {
                                        "frame_0.json": "File",
                                        "frame_1.json": "File",
                                        "frame_2.json": "File",
                                        "frame_3.json": "File",
                                        "frame_4.json": "File",
                                        "frame_5.json": "File",
                                        "frame_6.json": "File"
                                    }
                                },
                                "Toolstrips.json": "File"
                            }
                        },
                        "GuiRibbonGallery": {
                            "type": "Folder",
                            "content": {
                                "Container": {
                                    "type": "Folder",
                                    "content": {
                                        "frame_0.json": "File",
                                        "frame_1.json": "File"
                                    }
                                },
                                "Container.json": "File",
                                "Events": {
                                    "type": "Folder",
                                    "content": {
                                        "frame_0.json": "File",
                                        "frame_1.json": "File",
                                        "frame_2.json": "File",
                                        "frame_3.json": "File"
                                    }
                                },
                                "Events.json": "File"
                            }
                        },
                        "GuiRibbonGroup": {
                            "type": "Folder",
                            "content": {
                                "ClickCollapsedGroup": {
                                    "type": "Folder",
                                    "content": {
                                        "frame_0.json": "File",
                                        "frame_1.json": "File",
                                        "frame_2.json": "File",
                                        "frame_3.json": "File",
                                        "frame_4.json": "File",
                                        "frame_5.json": "File",
                                        "frame_6.json": "File"
                                    }
                                },
                                "ClickCollapsedGroup.json": "File",
                                "ClickExpandButton": {
                                    "type": "Folder",
                                    "content": {
                                        "frame_0.json": "File",
                                        "frame_1.json": "File"
                                    }
                                },
                                "ClickExpandButton.json": "File",
                                "ClickExpandButtonCollapsed": {
                                    "type": "Folder",
                                    "content": {
                                        "frame_0.json": "File",
                                        "frame_1.json": "File",
                                        "frame_2.json": "File",
                                        "frame_3.json": "File",
                                        "frame_4.json": "File",
                                        "frame_5.json": "File"
                                    }
                                },
                                "ClickExpandButtonCollapsed.json": "File",
                                "ReactiveView": {
                                    "type": "Folder",
                                    "content": {
                                        "frame_0.json": "File",
                                        "frame_1.json": "File",
                                        "frame_10.json": "File",
                                        "frame_2.json": "File",
                                        "frame_3.json": "File",
                                        "frame_4.json": "File",
                                        "frame_5.json": "File",
                                        "frame_6.json": "File",
                                        "frame_7.json": "File",
                                        "frame_8.json": "File",
                                        "frame_9.json": "File"
                                    }
                                },
                                "ReactiveView.json": "File"
                            }
                        },
                        "GuiRibbonTab": {
                            "type": "Folder",
                            "content": {
                                "Headers": {
                                    "type": "Folder",
                                    "content": {
                                        "frame_0.json": "File",
                                        "frame_1.json": "File",
                                        "frame_2.json": "File",
                                        "frame_3.json": "File",
                                        "frame_4.json": "File",
                                        "frame_5.json": "File"
                                    }
                                },
                                "Headers.json": "File",
                                "Menu": {
                                    "type": "Folder",
                                    "content": {
                                        "frame_0.json": "File",
                                        "frame_1.json": "File",
                                        "frame_2.json": "File",
                                        "frame_3.json": "File"
                                    }
                                },
                                "Menu.json": "File",
                                "MenuWithContent": {
                                    "type": "Folder",
                                    "content": {
                                        "frame_0.json": "File",
                                        "frame_1.json": "File",
                                        "frame_2.json": "File",
                                        "frame_3.json": "File",
                                        "frame_4.json": "File"
                                    }
                                },
                                "MenuWithContent.json": "File",
                                "Navigation": {
                                    "type": "Folder",
                                    "content": {
                                        "frame_0.json": "File",
                                        "frame_1.json": "File",
                                        "frame_10.json": "File",
                                        "frame_2.json": "File",
                                        "frame_3.json": "File",
                                        "frame_4.json": "File",
                                        "frame_5.json": "File",
                                        "frame_6.json": "File",
                                        "frame_7.json": "File",
                                        "frame_8.json": "File",
                                        "frame_9.json": "File"
                                    }
                                },
                                "Navigation.json": "File"
                            }
                        }
                    }
                },
                "Toolstrip": {
                    "type": "Folder",
                    "content": {
                        "Combo": {
                            "type": "Folder",
                            "content": {
                                "GuiComboBoxListControl": {
                                    "type": "Folder",
                                    "content": {
                                        "Alt": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File",
                                                "frame_5.json": "File"
                                            }
                                        },
                                        "Alt.json": "File",
                                        "Click": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File"
                                            }
                                        },
                                        "Click.json": "File",
                                        "ItemTemplate": {
                                            "type": "Folder",
                                            "content": {
                                                "Alt": {
                                                    "type": "Folder",
                                                    "content": {
                                                        "frame_0.json": "File",
                                                        "frame_1.json": "File",
                                                        "frame_2.json": "File",
                                                        "frame_3.json": "File",
                                                        "frame_4.json": "File",
                                                        "frame_5.json": "File"
                                                    }
                                                },
                                                "Alt.json": "File",
                                                "Click": {
                                                    "type": "Folder",
                                                    "content": {
                                                        "frame_0.json": "File",
                                                        "frame_1.json": "File",
                                                        "frame_2.json": "File",
                                                        "frame_3.json": "File"
                                                    }
                                                },
                                                "Click.json": "File",
                                                "Key": {
                                                    "type": "Folder",
                                                    "content": {
                                                        "frame_0.json": "File",
                                                        "frame_1.json": "File",
                                                        "frame_2.json": "File",
                                                        "frame_3.json": "File",
                                                        "frame_4.json": "File",
                                                        "frame_5.json": "File"
                                                    }
                                                },
                                                "Key.json": "File",
                                                "Properties": {
                                                    "type": "Folder",
                                                    "content": {
                                                        "frame_0.json": "File",
                                                        "frame_1.json": "File",
                                                        "frame_2.json": "File",
                                                        "frame_3.json": "File",
                                                        "frame_4.json": "File",
                                                        "frame_5.json": "File"
                                                    }
                                                },
                                                "Properties.json": "File"
                                            }
                                        },
                                        "Key": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File",
                                                "frame_5.json": "File"
                                            }
                                        },
                                        "Key.json": "File",
                                        "Properties": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File",
                                                "frame_5.json": "File"
                                            }
                                        },
                                        "Properties.json": "File"
                                    }
                                },
                                "GuiDateComboBox": {
                                    "type": "Folder",
                                    "content": {
                                        "Alt": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_10.json": "File",
                                                "frame_11.json": "File",
                                                "frame_12.json": "File",
                                                "frame_13.json": "File",
                                                "frame_14.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File",
                                                "frame_5.json": "File",
                                                "frame_6.json": "File",
                                                "frame_7.json": "File",
                                                "frame_8.json": "File",
                                                "frame_9.json": "File"
                                            }
                                        },
                                        "Alt.json": "File",
                                        "Mouse": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File",
                                                "frame_5.json": "File",
                                                "frame_6.json": "File"
                                            }
                                        },
                                        "Mouse.json": "File",
                                        "Properties": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File",
                                                "frame_5.json": "File",
                                                "frame_6.json": "File",
                                                "frame_7.json": "File",
                                                "frame_8.json": "File"
                                            }
                                        },
                                        "Properties.json": "File"
                                    }
                                },
                                "GuiDatePicker": {
                                    "type": "Folder",
                                    "content": {
                                        "Alt": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_10.json": "File",
                                                "frame_11.json": "File",
                                                "frame_12.json": "File",
                                                "frame_13.json": "File",
                                                "frame_14.json": "File",
                                                "frame_15.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File",
                                                "frame_5.json": "File",
                                                "frame_6.json": "File",
                                                "frame_7.json": "File",
                                                "frame_8.json": "File",
                                                "frame_9.json": "File"
                                            }
                                        },
                                        "Alt.json": "File",
                                        "Mouse": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File",
                                                "frame_5.json": "File"
                                            }
                                        },
                                        "Mouse.json": "File",
                                        "Properties": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File"
                                            }
                                        },
                                        "Properties.json": "File"
                                    }
                                }
                            }
                        },
                        "GuiToolstripMenu": {
                            "type": "Folder",
                            "content": {
                                "frame_0.json": "File",
                                "frame_1.json": "File",
                                "frame_2.json": "File",
                                "frame_3.json": "File",
                                "frame_4.json": "File",
                                "frame_5.json": "File",
                                "frame_6.json": "File",
                                "frame_7.json": "File",
                                "frame_8.json": "File"
                            }
                        },
                        "GuiToolstripMenu.json": "File",
                        "GuiToolstripMenuBar": {
                            "type": "Folder",
                            "content": {
                                "Alt": {
                                    "type": "Folder",
                                    "content": {
                                        "frame_0.json": "File",
                                        "frame_1.json": "File",
                                        "frame_2.json": "File",
                                        "frame_3.json": "File",
                                        "frame_4.json": "File"
                                    }
                                },
                                "Alt.json": "File",
                                "Cascade": {
                                    "type": "Folder",
                                    "content": {
                                        "AltSubMenu": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_10.json": "File",
                                                "frame_11.json": "File",
                                                "frame_12.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File",
                                                "frame_5.json": "File",
                                                "frame_6.json": "File",
                                                "frame_7.json": "File",
                                                "frame_8.json": "File",
                                                "frame_9.json": "File"
                                            }
                                        },
                                        "AltSubMenu.json": "File",
                                        "ClickSubMenu": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File",
                                                "frame_5.json": "File",
                                                "frame_6.json": "File"
                                            }
                                        },
                                        "ClickSubMenu.json": "File",
                                        "DisplaySubMenu": {
                                            "type": "Folder",
                                            "content": {
                                                "frame_0.json": "File",
                                                "frame_1.json": "File",
                                                "frame_2.json": "File",
                                                "frame_3.json": "File",
                                                "frame_4.json": "File",
                                                "frame_5.json": "File"
                                            }
                                        },
                                        "DisplaySubMenu.json": "File"
                                    }
                                },
                                "Click": {
                                    "type": "Folder",
                                    "content": {
                                        "frame_0.json": "File",
                                        "frame_1.json": "File",
                                        "frame_2.json": "File",
                                        "frame_3.json": "File",
                                        "frame_4.json": "File",
                                        "frame_5.json": "File"
                                    }
                                },
                                "Click.json": "File",
                                "ShortcutKey": {
                                    "type": "Folder",
                                    "content": {
                                        "frame_0.json": "File",
                                        "frame_1.json": "File",
                                        "frame_2.json": "File",
                                        "frame_3.json": "File"
                                    }
                                },
                                "ShortcutKey.json": "File"
                            }
                        },
                        "GuiToolstripToolBar": {
                            "type": "Folder",
                            "content": {
                                "AltAndShortcut": {
                                    "type": "Folder",
                                    "content": {
                                        "frame_0.json": "File",
                                        "frame_1.json": "File",
                                        "frame_10.json": "File",
                                        "frame_11.json": "File",
                                        "frame_12.json": "File",
                                        "frame_13.json": "File",
                                        "frame_14.json": "File",
                                        "frame_15.json": "File",
                                        "frame_16.json": "File",
                                        "frame_17.json": "File",
                                        "frame_18.json": "File",
                                        "frame_2.json": "File",
                                        "frame_3.json": "File",
                                        "frame_4.json": "File",
                                        "frame_5.json": "File",
                                        "frame_6.json": "File",
                                        "frame_7.json": "File",
                                        "frame_8.json": "File",
                                        "frame_9.json": "File"
                                    }
                                },
                                "AltAndShortcut.json": "File",
                                "ToolstripButton": {
                                    "type": "Folder",
                                    "content": {
                                        "frame_0.json": "File",
                                        "frame_1.json": "File",
                                        "frame_2.json": "File",
                                        "frame_3.json": "File",
                                        "frame_4.json": "File",
                                        "frame_5.json": "File"
                                    }
                                },
                                "ToolstripButton.json": "File",
                                "ToolstripDropdownButton": {
                                    "type": "Folder",
                                    "content": {
                                        "frame_0.json": "File",
                                        "frame_1.json": "File",
                                        "frame_2.json": "File"
                                    }
                                },
                                "ToolstripDropdownButton.json": "File",
                                "ToolstripSplitButton": {
                                    "type": "Folder",
                                    "content": {
                                        "frame_0.json": "File",
                                        "frame_1.json": "File",
                                        "frame_2.json": "File",
                                        "frame_3.json": "File"
                                    }
                                },
                                "ToolstripSplitButton.json": "File"
                            }
                        }
                    }
                }
            }
        },
        "DomRecovery": {
            "type": "Folder",
            "content": {
                "Clipping": {
                    "type": "Folder",
                    "content": {
                        "frame_0.json": "File"
                    }
                },
                "Clipping.json": "File",
                "EmptyWindow": {
                    "type": "Folder",
                    "content": {
                        "frame_0.json": "File"
                    }
                },
                "EmptyWindow.json": "File"
            }
        },
        "HelloWorld": {
            "type": "Folder",
            "content": {
                "frame_0.json": "File"
            }
        },
        "HelloWorld.json": "File",
        "UnitTestFramework": {
            "type": "Folder",
            "content": {
                "Channel": {
                    "type": "Folder",
                    "content": {
                        "Async": {
                            "type": "Folder",
                            "content": {
                                "frame_0.json": "File",
                                "frame_1.json": "File",
                                "frame_2.json": "File"
                            }
                        },
                        "Async.json": "File",
                        "DomDiff": {
                            "type": "Folder",
                            "content": {
                                "frame_0.json": "File",
                                "frame_1.json": "File",
                                "frame_2.json": "File"
                            }
                        },
                        "DomDiff.json": "File",
                        "Everything": {
                            "type": "Folder",
                            "content": {
                                "frame_0.json": "File",
                                "frame_1.json": "File",
                                "frame_2.json": "File"
                            }
                        },
                        "Everything.json": "File",
                        "Sync": {
                            "type": "Folder",
                            "content": {
                                "frame_0.json": "File",
                                "frame_1.json": "File",
                                "frame_2.json": "File"
                            }
                        },
                        "Sync.json": "File"
                    }
                },
                "SingleImage": {
                    "type": "Folder",
                    "content": {
                        "frame_0.json": "File"
                    }
                },
                "SingleImage.json": "File",
                "WindowWithOKButton": {
                    "type": "Folder",
                    "content": {
                        "frame_0.json": "File"
                    }
                },
                "WindowWithOKButton.json": "File",
                "WindowWithOKButton_Click": {
                    "type": "Folder",
                    "content": {
                        "frame_0.json": "File"
                    }
                },
                "WindowWithOKButton_Click.json": "File",
                "WindowWithOKButton_ClickInSteps": {
                    "type": "Folder",
                    "content": {
                        "frame_0.json": "File",
                        "frame_1.json": "File",
                        "frame_2.json": "File"
                    }
                },
                "WindowWithOKButton_ClickInSteps.json": "File"
            }
        }
    }
};
