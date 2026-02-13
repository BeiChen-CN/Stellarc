; Stellarc NSIS Installer
; License → Directory → Options → Install

!macro customHeader
  !define MUI_BRANDINGTEXT "Stellarc - 课堂随机点名工具"
!macroend

; Custom page: desktop shortcut + auto start options
Var CreateDesktopShortcut
Var EnableAutoStart

!macro customPageAfterChangeDir
  Page custom OptionsPageCreate OptionsPageLeave
!macroend

Function OptionsPageCreate
  nsDialogs::Create 1018
  Pop $0

  ${NSD_CreateLabel} 0 0 100% 20u "选择附加选项："
  Pop $0

  ${NSD_CreateCheckbox} 20u 30u 100% 15u "创建桌面快捷方式"
  Pop $CreateDesktopShortcut
  ${NSD_Check} $CreateDesktopShortcut

  ${NSD_CreateCheckbox} 20u 52u 100% 15u "开机自动启动"
  Pop $EnableAutoStart
  ${NSD_Check} $EnableAutoStart

  nsDialogs::Show
FunctionEnd

Function OptionsPageLeave
  ${NSD_GetState} $CreateDesktopShortcut $CreateDesktopShortcut
  ${NSD_GetState} $EnableAutoStart $EnableAutoStart
FunctionEnd

!macro customInstall
  ; Registry metadata
  WriteRegStr SHCTX "Software\Stellarc" "InstallPath" "$INSTDIR"
  WriteRegStr SHCTX "Software\Stellarc" "Version" "${VERSION}"

  ; Desktop shortcut (if checked)
  ${If} $CreateDesktopShortcut == ${BST_CHECKED}
    CreateShortCut "$DESKTOP\Stellarc.lnk" "$INSTDIR\stellarc.exe"
  ${EndIf}

  ; Auto start (if checked)
  ${If} $EnableAutoStart == ${BST_CHECKED}
    WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "Stellarc" '"$INSTDIR\stellarc.exe"'
  ${EndIf}
!macroend

!macro customUnInstall
  ; Clean up
  DeleteRegKey SHCTX "Software\Stellarc"
  DeleteRegValue HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "Stellarc"
  Delete "$DESKTOP\Stellarc.lnk"
!macroend
