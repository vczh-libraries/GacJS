export interface SnapshotFolder {
    type: 'Folder';
    content: { [key: string]: SnapshotEntry };
}

export type SnapshotEntry = SnapshotFolder | 'File';

export const Snapshot: SnapshotEntry = {
    'type': 'Folder',
    'content': {
        'Application': {
            'type': 'Folder',
            'content': {
                'ControlTemplate.json': 'File',
                'ControlThemeName.json': 'File',
                'FocusedAndDelete.json': 'File',
                'FocusedAndDisable.json': 'File',
                'FocusedAndHide.json': 'File',
                'TabNavigate.json': 'File',
                'TabNavigateWithContainer.json': 'File',
                'Windows': {
                    'type': 'Folder',
                    'content': {
                        'Closing.json': 'File',
                        'Dragging.json': 'File',
                        'Enabling.json': 'File',
                        'Order.json': 'File',
                        'Resizing.json': 'File',
                        'ShowModal.json': 'File'
                    }
                }
            }
        },
        'Controls': {
            'type': 'Folder',
            'content': {
                'Basic': {
                    'type': 'Folder',
                    'content': {
                        'GuiButton': {
                            'type': 'Folder',
                            'content': {
                                'AcknowledgeChildControlMouseEvents.json': 'File',
                                'AutoFocus.json': 'File',
                                'ClickOnMouseDown.json': 'File',
                                'ClickOnMouseUp.json': 'File',
                                'Disabled.json': 'File',
                                'IgnoreChildControlMouseEvents.json': 'File',
                                'PressEnter.json': 'File',
                                'PressSpace.json': 'File'
                            }
                        },
                        'GuiScroll': {
                            'type': 'Folder',
                            'content': {
                                'HScroll': {
                                    'type': 'Folder',
                                    'content': {
                                        'Click.json': 'File',
                                        'Key.json': 'File',
                                        'Mouse.json': 'File',
                                        'Properties.json': 'File'
                                    }
                                },
                                'HTracker': {
                                    'type': 'Folder',
                                    'content': {
                                        'Key.json': 'File',
                                        'Mouse.json': 'File',
                                        'Properties.json': 'File'
                                    }
                                },
                                'ProgressBar.json': 'File',
                                'VScroll': {
                                    'type': 'Folder',
                                    'content': {
                                        'Click.json': 'File',
                                        'Key.json': 'File',
                                        'Mouse.json': 'File',
                                        'Properties.json': 'File'
                                    }
                                },
                                'VTracker': {
                                    'type': 'Folder',
                                    'content': {
                                        'Key.json': 'File',
                                        'Mouse.json': 'File',
                                        'Properties.json': 'File'
                                    }
                                }
                            }
                        },
                        'GuiScrollContainer': {
                            'type': 'Folder',
                            'content': {
                                'AlwaysInvisible.json': 'File',
                                'AlwaysVisible.json': 'File',
                                'ExtendToFullSize.json': 'File'
                            }
                        },
                        'GuiSelectableButton': {
                            'type': 'Folder',
                            'content': {
                                'AutoSelection.json': 'File',
                                'MutexGroup.json': 'File',
                                'MutexSelection.json': 'File'
                            }
                        },
                        'GuiTab': {
                            'type': 'Folder',
                            'content': {
                                'ModifyPages.json': 'File',
                                'Navigation.json': 'File',
                                'NavigationAlt.json': 'File',
                                'NavigationTab.json': 'File'
                            }
                        }
                    }
                },
                'CoreApplication': {
                    'type': 'Folder',
                    'content': {
                        'GuiControl': {
                            'type': 'Folder',
                            'content': {
                                'AltFocus.json': 'File',
                                'AltLabel.json': 'File',
                                'Context.json': 'File',
                                'Enable.json': 'File',
                                'Focus.json': 'File',
                                'Font.json': 'File',
                                'MyControlTemplate.json': 'File',
                                'Visible.json': 'File'
                            }
                        },
                        'GuiLabel.json': 'File',
                        'WindowFeatures.json': 'File',
                        'WindowMaximized.json': 'File',
                        'WindowSizing.json': 'File'
                    }
                },
                'List': {
                    'type': 'Folder',
                    'content': {
                        'GuiBindableDataGrid': {
                            'type': 'Folder',
                            'content': {
                                'AsListView': {
                                    'type': 'Folder',
                                    'content': {
                                        'BigIcon': {
                                            'type': 'Folder',
                                            'content': {
                                                'MakeInvisibleItems.json': 'File',
                                                'MakeVisibleItems.json': 'File',
                                                'NavigateByClickAndKey.json': 'File',
                                                'UpdateInvisibleItems.json': 'File',
                                                'UpdateVisibleItems.json': 'File'
                                            }
                                        },
                                        'Detail': {
                                            'type': 'Folder',
                                            'content': {
                                                'MakeInvisibleItems.json': 'File',
                                                'MakeVisibleItems.json': 'File',
                                                'NavigateByClickAndKey.json': 'File',
                                                'UpdateInvisibleItems.json': 'File',
                                                'UpdateVisibleItems.json': 'File'
                                            }
                                        },
                                        'Information': {
                                            'type': 'Folder',
                                            'content': {
                                                'MakeInvisibleItems.json': 'File',
                                                'MakeVisibleItems.json': 'File',
                                                'NavigateByClickAndKey.json': 'File',
                                                'UpdateInvisibleItems.json': 'File',
                                                'UpdateVisibleItems.json': 'File'
                                            }
                                        },
                                        'List': {
                                            'type': 'Folder',
                                            'content': {
                                                'MakeInvisibleItems.json': 'File',
                                                'MakeVisibleItems.json': 'File',
                                                'NavigateByClickAndKey.json': 'File',
                                                'UpdateInvisibleItems.json': 'File',
                                                'UpdateVisibleItems.json': 'File'
                                            }
                                        },
                                        'PropertyBinding.json': 'File',
                                        'SmallIcon': {
                                            'type': 'Folder',
                                            'content': {
                                                'MakeInvisibleItems.json': 'File',
                                                'MakeVisibleItems.json': 'File',
                                                'NavigateByClickAndKey.json': 'File',
                                                'UpdateInvisibleItems.json': 'File',
                                                'UpdateVisibleItems.json': 'File'
                                            }
                                        },
                                        'SwitchViews.json': 'File',
                                        'Tile': {
                                            'type': 'Folder',
                                            'content': {
                                                'MakeInvisibleItems.json': 'File',
                                                'MakeVisibleItems.json': 'File',
                                                'NavigateByClickAndKey.json': 'File',
                                                'UpdateInvisibleItems.json': 'File',
                                                'UpdateVisibleItems.json': 'File'
                                            }
                                        }
                                    }
                                },
                                'Binding': {
                                    'type': 'Folder',
                                    'content': {
                                        'DisplayEmumProperties.json': 'File',
                                        'DisplayMixedProperties.json': 'File',
                                        'DisplayStringProperties.json': 'File',
                                        'PropertyBinding.json': 'File'
                                    }
                                },
                                'CellEditor': {
                                    'type': 'Folder',
                                    'content': {
                                        'ComboEditor.json': 'File',
                                        'ComboEditorWithSorterAndFilter.json': 'File',
                                        'ComboEditorWithSorterAndFilter2.json': 'File'
                                    }
                                },
                                'CellVisualizer': {
                                    'type': 'Folder',
                                    'content': {
                                        'ClickHyperlink.json': 'File',
                                        'SorterAndFilter.json': 'File'
                                    }
                                },
                                'ColumnApi': {
                                    'type': 'Folder',
                                    'content': {
                                        'ChangeDataSource.json': 'File',
                                        'FilterByColumn.json': 'File',
                                        'ReplaceDataSource.json': 'File',
                                        'SortByColumn.json': 'File',
                                        'SorterAndFilter.json': 'File'
                                    }
                                },
                                'ColumnUI': {
                                    'type': 'Folder',
                                    'content': {
                                        'FilterByColumn.json': 'File',
                                        'SortByColumn.json': 'File'
                                    }
                                },
                                'Properties': {
                                    'type': 'Folder',
                                    'content': {
                                        'SelectCell.json': 'File',
                                        'SelectCellByClick.json': 'File',
                                        'SelectCellByKey.json': 'File',
                                        'SelectCellOpenEditor.json': 'File'
                                    }
                                }
                            }
                        },
                        'GuiBindableListView': {
                            'type': 'Folder',
                            'content': {
                                'BigIcon': {
                                    'type': 'Folder',
                                    'content': {
                                        'MakeInvisibleItems.json': 'File',
                                        'MakeVisibleItems.json': 'File',
                                        'NavigateByClickAndKey.json': 'File',
                                        'UpdateInvisibleItems.json': 'File',
                                        'UpdateVisibleItems.json': 'File'
                                    }
                                },
                                'Detail': {
                                    'type': 'Folder',
                                    'content': {
                                        'MakeInvisibleItems.json': 'File',
                                        'MakeVisibleItems.json': 'File',
                                        'NavigateByClickAndKey.json': 'File',
                                        'UpdateInvisibleItems.json': 'File',
                                        'UpdateVisibleItems.json': 'File'
                                    }
                                },
                                'Information': {
                                    'type': 'Folder',
                                    'content': {
                                        'MakeInvisibleItems.json': 'File',
                                        'MakeVisibleItems.json': 'File',
                                        'NavigateByClickAndKey.json': 'File',
                                        'UpdateInvisibleItems.json': 'File',
                                        'UpdateVisibleItems.json': 'File'
                                    }
                                },
                                'List': {
                                    'type': 'Folder',
                                    'content': {
                                        'MakeInvisibleItems.json': 'File',
                                        'MakeVisibleItems.json': 'File',
                                        'NavigateByClickAndKey.json': 'File',
                                        'UpdateInvisibleItems.json': 'File',
                                        'UpdateVisibleItems.json': 'File'
                                    }
                                },
                                'PropertyBinding.json': 'File',
                                'SmallIcon': {
                                    'type': 'Folder',
                                    'content': {
                                        'MakeInvisibleItems.json': 'File',
                                        'MakeVisibleItems.json': 'File',
                                        'NavigateByClickAndKey.json': 'File',
                                        'UpdateInvisibleItems.json': 'File',
                                        'UpdateVisibleItems.json': 'File'
                                    }
                                },
                                'SwitchViews.json': 'File',
                                'Tile': {
                                    'type': 'Folder',
                                    'content': {
                                        'MakeInvisibleItems.json': 'File',
                                        'MakeVisibleItems.json': 'File',
                                        'NavigateByClickAndKey.json': 'File',
                                        'UpdateInvisibleItems.json': 'File',
                                        'UpdateVisibleItems.json': 'File'
                                    }
                                }
                            }
                        },
                        'GuiBindableTextList': {
                            'type': 'Folder',
                            'content': {
                                'ClickVisibleItems.json': 'File',
                                'GuiTextListItemTemplate': {
                                    'type': 'Folder',
                                    'content': {
                                        'ClickVisibleItems.json': 'File',
                                        'UpdateInvisibleItems.json': 'File',
                                        'UpdateVisibleItems.json': 'File'
                                    }
                                },
                                'MakeInvisibleItems.json': 'File',
                                'MakeVisibleItems.json': 'File',
                                'PropertyBinding.json': 'File',
                                'UpdateInvisibleItems.json': 'File',
                                'UpdateVisibleItems.json': 'File'
                            }
                        },
                        'GuiBindableTreeView': {
                            'type': 'Folder',
                            'content': {
                                'ClickAndExpandCollapseItems.json': 'File',
                                'DBClickAndExpandCollapseItems.json': 'File',
                                'Image.json': 'File',
                                'KeyAndExpandCollapseItems.json': 'File',
                                'MakeInvisibleChildItems.json': 'File',
                                'MakeInvisibleItems.json': 'File',
                                'MakeVisibleChildItems.json': 'File',
                                'MakeVisibleItems.json': 'File',
                                'PropertyBinding.json': 'File',
                                'UpdateInvisibleChildItems.json': 'File',
                                'UpdateInvisibleItems.json': 'File',
                                'UpdateVisibleChildItems.json': 'File',
                                'UpdateVisibleItems.json': 'File'
                            }
                        },
                        'GuiListControl': {
                            'type': 'Folder',
                            'content': {
                                'GuiBindableDataGrid': {
                                    'type': 'Folder',
                                    'content': {
                                        'LeftMouseEvents.json': 'File',
                                        'MiddleMouseEvents.json': 'File',
                                        'MouseWheel.json': 'File',
                                        'RightMouseEvents.json': 'File',
                                        'Scrolling.json': 'File'
                                    }
                                },
                                'GuiBindableListView': {
                                    'type': 'Folder',
                                    'content': {
                                        'LeftMouseEvents.json': 'File',
                                        'MiddleMouseEvents.json': 'File',
                                        'MouseWheel.json': 'File',
                                        'RightMouseEvents.json': 'File',
                                        'Scrolling.json': 'File'
                                    }
                                },
                                'GuiBindableTextList': {
                                    'type': 'Folder',
                                    'content': {
                                        'LeftMouseEvents.json': 'File',
                                        'MiddleMouseEvents.json': 'File',
                                        'MouseWheel.json': 'File',
                                        'RightMouseEvents.json': 'File',
                                        'Scrolling.json': 'File'
                                    }
                                },
                                'GuiBindableTreeView': {
                                    'type': 'Folder',
                                    'content': {
                                        'LeftMouseEvents.json': 'File',
                                        'MiddleMouseEvents.json': 'File',
                                        'MouseWheel.json': 'File',
                                        'RightMouseEvents.json': 'File',
                                        'Scrolling.json': 'File'
                                    }
                                },
                                'GuiListView': {
                                    'type': 'Folder',
                                    'content': {
                                        'LeftMouseEvents.json': 'File',
                                        'MiddleMouseEvents.json': 'File',
                                        'MouseWheel.json': 'File',
                                        'RightMouseEvents.json': 'File',
                                        'Scrolling.json': 'File'
                                    }
                                },
                                'GuiTextList': {
                                    'type': 'Folder',
                                    'content': {
                                        'LeftMouseEvents.json': 'File',
                                        'MiddleMouseEvents.json': 'File',
                                        'MouseWheel.json': 'File',
                                        'RightMouseEvents.json': 'File',
                                        'Scrolling.json': 'File'
                                    }
                                },
                                'GuiTreeView': {
                                    'type': 'Folder',
                                    'content': {
                                        'LeftMouseEvents.json': 'File',
                                        'MiddleMouseEvents.json': 'File',
                                        'MouseWheel.json': 'File',
                                        'RightMouseEvents.json': 'File',
                                        'Scrolling.json': 'File'
                                    }
                                }
                            }
                        },
                        'GuiListItemTemplate': {
                            'type': 'Folder',
                            'content': {
                                'GuiBindableDataGrid': {
                                    'type': 'Folder',
                                    'content': {
                                        'ArrangerAndAxis.json': 'File',
                                        'ArrangerAndAxisWithScrolls.json': 'File',
                                        'Context.json': 'File',
                                        'DisplayItemBackground.json': 'File',
                                        'Font.json': 'File',
                                        'MouseVisualEffect.json': 'File'
                                    }
                                },
                                'GuiBindableListView': {
                                    'type': 'Folder',
                                    'content': {
                                        'ArrangerAndAxis.json': 'File',
                                        'ArrangerAndAxisWithScrolls.json': 'File',
                                        'Context.json': 'File',
                                        'DisplayItemBackground.json': 'File',
                                        'Font.json': 'File',
                                        'MouseVisualEffect.json': 'File'
                                    }
                                },
                                'GuiBindableTextList': {
                                    'type': 'Folder',
                                    'content': {
                                        'ArrangerAndAxis.json': 'File',
                                        'ArrangerAndAxisWithScrolls.json': 'File',
                                        'Context.json': 'File',
                                        'DisplayItemBackground.json': 'File',
                                        'Font.json': 'File',
                                        'MouseVisualEffect.json': 'File'
                                    }
                                },
                                'GuiBindableTreeView': {
                                    'type': 'Folder',
                                    'content': {
                                        'ArrangerAndAxis.json': 'File',
                                        'ArrangerAndAxisWithScrolls.json': 'File',
                                        'Context.json': 'File',
                                        'DisplayItemBackground.json': 'File',
                                        'Font.json': 'File',
                                        'MouseVisualEffect.json': 'File'
                                    }
                                },
                                'GuiListView': {
                                    'type': 'Folder',
                                    'content': {
                                        'ArrangerAndAxis.json': 'File',
                                        'ArrangerAndAxisWithScrolls.json': 'File',
                                        'Context.json': 'File',
                                        'DisplayItemBackground.json': 'File',
                                        'Font.json': 'File',
                                        'MouseVisualEffect.json': 'File'
                                    }
                                },
                                'GuiTextList': {
                                    'type': 'Folder',
                                    'content': {
                                        'ArrangerAndAxis.json': 'File',
                                        'ArrangerAndAxisWithScrolls.json': 'File',
                                        'Context.json': 'File',
                                        'DisplayItemBackground.json': 'File',
                                        'Font.json': 'File',
                                        'MouseVisualEffect.json': 'File'
                                    }
                                },
                                'GuiTreeView': {
                                    'type': 'Folder',
                                    'content': {
                                        'ArrangerAndAxis.json': 'File',
                                        'ArrangerAndAxisWithScrolls.json': 'File',
                                        'Context.json': 'File',
                                        'DisplayItemBackground.json': 'File',
                                        'Font.json': 'File',
                                        'MouseVisualEffect.json': 'File'
                                    }
                                }
                            }
                        },
                        'GuiListView': {
                            'type': 'Folder',
                            'content': {
                                'BigIcon': {
                                    'type': 'Folder',
                                    'content': {
                                        'MakeInvisibleItems.json': 'File',
                                        'MakeVisibleItems.json': 'File',
                                        'NavigateByClickAndKey.json': 'File',
                                        'UpdateInvisibleItems.json': 'File',
                                        'UpdateVisibleItems.json': 'File'
                                    }
                                },
                                'Detail': {
                                    'type': 'Folder',
                                    'content': {
                                        'MakeInvisibleItems.json': 'File',
                                        'MakeVisibleItems.json': 'File',
                                        'NavigateByClickAndKey.json': 'File',
                                        'UpdateInvisibleItems.json': 'File',
                                        'UpdateVisibleItems.json': 'File'
                                    }
                                },
                                'Information': {
                                    'type': 'Folder',
                                    'content': {
                                        'MakeInvisibleItems.json': 'File',
                                        'MakeVisibleItems.json': 'File',
                                        'NavigateByClickAndKey.json': 'File',
                                        'UpdateInvisibleItems.json': 'File',
                                        'UpdateVisibleItems.json': 'File'
                                    }
                                },
                                'List': {
                                    'type': 'Folder',
                                    'content': {
                                        'MakeInvisibleItems.json': 'File',
                                        'MakeVisibleItems.json': 'File',
                                        'NavigateByClickAndKey.json': 'File',
                                        'UpdateInvisibleItems.json': 'File',
                                        'UpdateVisibleItems.json': 'File'
                                    }
                                },
                                'SmallIcon': {
                                    'type': 'Folder',
                                    'content': {
                                        'MakeInvisibleItems.json': 'File',
                                        'MakeVisibleItems.json': 'File',
                                        'NavigateByClickAndKey.json': 'File',
                                        'UpdateInvisibleItems.json': 'File',
                                        'UpdateVisibleItems.json': 'File'
                                    }
                                },
                                'SwitchViews.json': 'File',
                                'Tile': {
                                    'type': 'Folder',
                                    'content': {
                                        'MakeInvisibleItems.json': 'File',
                                        'MakeVisibleItems.json': 'File',
                                        'NavigateByClickAndKey.json': 'File',
                                        'UpdateInvisibleItems.json': 'File',
                                        'UpdateVisibleItems.json': 'File'
                                    }
                                }
                            }
                        },
                        'GuiSelectableListControl': {
                            'type': 'Folder',
                            'content': {
                                'GuiBindableDataGrid': {
                                    'type': 'Folder',
                                    'content': {
                                        'MultiSelect': {
                                            'type': 'Folder',
                                            'content': {
                                                'Click.json': 'File',
                                                'Key.json': 'File',
                                                'Properties.json': 'File',
                                                'SelectItemsByClick.json': 'File',
                                                'SelectItemsByKey.json': 'File'
                                            }
                                        },
                                        'SingleSelect': {
                                            'type': 'Folder',
                                            'content': {
                                                'Click.json': 'File',
                                                'Key.json': 'File',
                                                'Properties.json': 'File',
                                                'SelectItemsByClick.json': 'File',
                                                'SelectItemsByKey.json': 'File'
                                            }
                                        }
                                    }
                                },
                                'GuiBindableListView': {
                                    'type': 'Folder',
                                    'content': {
                                        'MultiSelect': {
                                            'type': 'Folder',
                                            'content': {
                                                'Click.json': 'File',
                                                'Key.json': 'File',
                                                'Properties.json': 'File',
                                                'SelectItemsByClick.json': 'File',
                                                'SelectItemsByKey.json': 'File'
                                            }
                                        },
                                        'SingleSelect': {
                                            'type': 'Folder',
                                            'content': {
                                                'Click.json': 'File',
                                                'Key.json': 'File',
                                                'Properties.json': 'File',
                                                'SelectItemsByClick.json': 'File',
                                                'SelectItemsByKey.json': 'File'
                                            }
                                        }
                                    }
                                },
                                'GuiBindableTextList': {
                                    'type': 'Folder',
                                    'content': {
                                        'MultiSelect': {
                                            'type': 'Folder',
                                            'content': {
                                                'Click.json': 'File',
                                                'Key.json': 'File',
                                                'Properties.json': 'File',
                                                'SelectItemsByClick.json': 'File',
                                                'SelectItemsByKey.json': 'File'
                                            }
                                        },
                                        'SingleSelect': {
                                            'type': 'Folder',
                                            'content': {
                                                'Click.json': 'File',
                                                'Key.json': 'File',
                                                'Properties.json': 'File',
                                                'SelectItemsByClick.json': 'File',
                                                'SelectItemsByKey.json': 'File'
                                            }
                                        }
                                    }
                                },
                                'GuiBindableTreeView': {
                                    'type': 'Folder',
                                    'content': {
                                        'MultiSelect': {
                                            'type': 'Folder',
                                            'content': {
                                                'Click.json': 'File',
                                                'Key.json': 'File',
                                                'Properties.json': 'File',
                                                'SelectItemsByClick.json': 'File',
                                                'SelectItemsByKey.json': 'File'
                                            }
                                        },
                                        'SingleSelect': {
                                            'type': 'Folder',
                                            'content': {
                                                'Click.json': 'File',
                                                'Key.json': 'File',
                                                'Properties.json': 'File',
                                                'SelectItemsByClick.json': 'File',
                                                'SelectItemsByKey.json': 'File'
                                            }
                                        }
                                    }
                                },
                                'GuiListView': {
                                    'type': 'Folder',
                                    'content': {
                                        'MultiSelect': {
                                            'type': 'Folder',
                                            'content': {
                                                'Click.json': 'File',
                                                'Key.json': 'File',
                                                'Properties.json': 'File',
                                                'SelectItemsByClick.json': 'File',
                                                'SelectItemsByKey.json': 'File'
                                            }
                                        },
                                        'SingleSelect': {
                                            'type': 'Folder',
                                            'content': {
                                                'Click.json': 'File',
                                                'Key.json': 'File',
                                                'Properties.json': 'File',
                                                'SelectItemsByClick.json': 'File',
                                                'SelectItemsByKey.json': 'File'
                                            }
                                        }
                                    }
                                },
                                'GuiTextList': {
                                    'type': 'Folder',
                                    'content': {
                                        'MultiSelect': {
                                            'type': 'Folder',
                                            'content': {
                                                'Click.json': 'File',
                                                'Key.json': 'File',
                                                'Properties.json': 'File',
                                                'SelectItemsByClick.json': 'File',
                                                'SelectItemsByKey.json': 'File'
                                            }
                                        },
                                        'SingleSelect': {
                                            'type': 'Folder',
                                            'content': {
                                                'Click.json': 'File',
                                                'Key.json': 'File',
                                                'Properties.json': 'File',
                                                'SelectItemsByClick.json': 'File',
                                                'SelectItemsByKey.json': 'File'
                                            }
                                        }
                                    }
                                },
                                'GuiTreeView': {
                                    'type': 'Folder',
                                    'content': {
                                        'MultiSelect': {
                                            'type': 'Folder',
                                            'content': {
                                                'Click.json': 'File',
                                                'Key.json': 'File',
                                                'Properties.json': 'File',
                                                'SelectItemsByClick.json': 'File',
                                                'SelectItemsByKey.json': 'File'
                                            }
                                        },
                                        'SingleSelect': {
                                            'type': 'Folder',
                                            'content': {
                                                'Click.json': 'File',
                                                'Key.json': 'File',
                                                'Properties.json': 'File',
                                                'SelectItemsByClick.json': 'File',
                                                'SelectItemsByKey.json': 'File'
                                            }
                                        }
                                    }
                                }
                            }
                        },
                        'GuiTextList': {
                            'type': 'Folder',
                            'content': {
                                'ClickVisibleItems.json': 'File',
                                'GuiTextListItemTemplate': {
                                    'type': 'Folder',
                                    'content': {
                                        'ClickVisibleItems.json': 'File',
                                        'UpdateInvisibleItems.json': 'File',
                                        'UpdateVisibleItems.json': 'File'
                                    }
                                },
                                'MakeInvisibleItems.json': 'File',
                                'MakeVisibleItems.json': 'File',
                                'UpdateInvisibleItems.json': 'File',
                                'UpdateVisibleItems.json': 'File'
                            }
                        },
                        'GuiTreeItemTemplate': {
                            'type': 'Folder',
                            'content': {
                                'GuiBindableTreeView': {
                                    'type': 'Folder',
                                    'content': {
                                        'ClickAndExpandCollapseItems.json': 'File',
                                        'Context.json': 'File',
                                        'DBClickAndExpandCollapseItems.json': 'File',
                                        'DisplayItemBackground.json': 'File',
                                        'Font.json': 'File',
                                        'Image.json': 'File',
                                        'KeyAndExpandCollapseItems.json': 'File',
                                        'MouseVisualEffect.json': 'File',
                                        'UpdateInvisibleChildItems.json': 'File',
                                        'UpdateInvisibleItems.json': 'File',
                                        'UpdateVisibleChildItems.json': 'File',
                                        'UpdateVisibleItems.json': 'File'
                                    }
                                },
                                'GuiTreeView': {
                                    'type': 'Folder',
                                    'content': {
                                        'ClickAndExpandCollapseItems.json': 'File',
                                        'Context.json': 'File',
                                        'DBClickAndExpandCollapseItems.json': 'File',
                                        'DisplayItemBackground.json': 'File',
                                        'Font.json': 'File',
                                        'Image.json': 'File',
                                        'KeyAndExpandCollapseItems.json': 'File',
                                        'MouseVisualEffect.json': 'File',
                                        'UpdateInvisibleChildItems.json': 'File',
                                        'UpdateInvisibleItems.json': 'File',
                                        'UpdateVisibleChildItems.json': 'File',
                                        'UpdateVisibleItems.json': 'File'
                                    }
                                }
                            }
                        },
                        'GuiTreeView': {
                            'type': 'Folder',
                            'content': {
                                'ClickAndExpandCollapseItems.json': 'File',
                                'DBClickAndExpandCollapseItems.json': 'File',
                                'Image.json': 'File',
                                'KeyAndExpandCollapseItems.json': 'File',
                                'MakeInvisibleChildItems.json': 'File',
                                'MakeInvisibleItems.json': 'File',
                                'MakeVisibleChildItems.json': 'File',
                                'MakeVisibleItems.json': 'File',
                                'UpdateInvisibleChildItems.json': 'File',
                                'UpdateInvisibleItems.json': 'File',
                                'UpdateVisibleChildItems.json': 'File',
                                'UpdateVisibleItems.json': 'File'
                            }
                        },
                        'GuiVirtualTreeListControl': {
                            'type': 'Folder',
                            'content': {
                                'GuiBindableTreeView': {
                                    'type': 'Folder',
                                    'content': {
                                        'LeftMouseEvents.json': 'File',
                                        'MiddleMouseEvents.json': 'File',
                                        'RightMouseEvents.json': 'File'
                                    }
                                },
                                'GuiTreeView': {
                                    'type': 'Folder',
                                    'content': {
                                        'LeftMouseEvents.json': 'File',
                                        'MiddleMouseEvents.json': 'File',
                                        'RightMouseEvents.json': 'File'
                                    }
                                }
                            }
                        }
                    }
                },
                'Ribbon': {
                    'type': 'Folder',
                    'content': {
                        'GuiBindableRibbonGalleryList': {
                            'type': 'Folder',
                            'content': {
                                'Dropdown.json': 'File',
                                'ReactiveView.json': 'File'
                            }
                        },
                        'GuiRibbonButtons': {
                            'type': 'Folder',
                            'content': {
                                'Dropdowns.json': 'File',
                                'ReactiveView.json': 'File',
                                'Toolstrips.json': 'File'
                            }
                        },
                        'GuiRibbonGallery': {
                            'type': 'Folder',
                            'content': {
                                'Container.json': 'File',
                                'Events.json': 'File'
                            }
                        },
                        'GuiRibbonGroup': {
                            'type': 'Folder',
                            'content': {
                                'ClickCollapsedGroup.json': 'File',
                                'ClickExpandButton.json': 'File',
                                'ClickExpandButtonCollapsed.json': 'File',
                                'ReactiveView.json': 'File'
                            }
                        },
                        'GuiRibbonTab': {
                            'type': 'Folder',
                            'content': {
                                'Headers.json': 'File',
                                'Menu.json': 'File',
                                'MenuWithContent.json': 'File',
                                'Navigation.json': 'File'
                            }
                        }
                    }
                },
                'Toolstrip': {
                    'type': 'Folder',
                    'content': {
                        'Combo': {
                            'type': 'Folder',
                            'content': {
                                'GuiComboBoxListControl': {
                                    'type': 'Folder',
                                    'content': {
                                        'Alt.json': 'File',
                                        'Click.json': 'File',
                                        'ItemTemplate': {
                                            'type': 'Folder',
                                            'content': {
                                                'Alt.json': 'File',
                                                'Click.json': 'File',
                                                'Key.json': 'File',
                                                'Properties.json': 'File'
                                            }
                                        },
                                        'Key.json': 'File',
                                        'Properties.json': 'File'
                                    }
                                },
                                'GuiDateComboBox': {
                                    'type': 'Folder',
                                    'content': {
                                        'Mouse.json': 'File',
                                        'Properties.json': 'File'
                                    }
                                },
                                'GuiDatePicker': {
                                    'type': 'Folder',
                                    'content': {
                                        'Alt.json': 'File',
                                        'Mouse.json': 'File',
                                        'Properties.json': 'File'
                                    }
                                }
                            }
                        },
                        'GuiToolstripMenu.json': 'File',
                        'GuiToolstripMenuBar': {
                            'type': 'Folder',
                            'content': {
                                'Alt.json': 'File',
                                'Cascade': {
                                    'type': 'Folder',
                                    'content': {
                                        'AltSubMenu.json': 'File',
                                        'ClickSubMenu.json': 'File',
                                        'DisplaySubMenu.json': 'File'
                                    }
                                },
                                'Click.json': 'File',
                                'ShortcutKey.json': 'File'
                            }
                        },
                        'GuiToolstripToolBar': {
                            'type': 'Folder',
                            'content': {
                                'AltAndShortcut.json': 'File',
                                'ToolstripButton.json': 'File',
                                'ToolstripDropdownButton.json': 'File',
                                'ToolstripSplitButton.json': 'File'
                            }
                        }
                    }
                }
            }
        },
        'DomRecovery': {
            'type': 'Folder',
            'content': {
                'Clipping.json': 'File',
                'EmptyWindow.json': 'File'
            }
        },
        'HelloWorld.json': 'File',
        'UnitTestFramework': {
            'type': 'Folder',
            'content': {
                'Channel': {
                    'type': 'Folder',
                    'content': {
                        'Async.json': 'File',
                        'DomDiff.json': 'File',
                        'Everything.json': 'File',
                        'Sync.json': 'File'
                    }
                },
                'SingleImage.json': 'File',
                'WindowWithOKButton.json': 'File',
                'WindowWithOKButton_Click.json': 'File',
                'WindowWithOKButton_ClickInSteps.json': 'File'
            }
        }
    }
};
