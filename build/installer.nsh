; Stellarc NSIS Installer

!macro customHeader
  !define MUI_BRANDINGTEXT "Stellarc - 课堂随机点名工具"
!macroend

!macro customInstall
  ; Registry metadata
  WriteRegStr SHCTX "Software\Stellarc" "InstallPath" "$INSTDIR"
  WriteRegStr SHCTX "Software\Stellarc" "Version" "${VERSION}"

  ; Desktop shortcut
  CreateShortCut "$DESKTOP\Stellarc.lnk" "$INSTDIR\stellarc.exe"

  ; Auto start
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "Stellarc" '"$INSTDIR\stellarc.exe"'
!macroend

!macro customUnInstall
  ; Clean up
  DeleteRegKey SHCTX "Software\Stellarc"
  DeleteRegValue HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "Stellarc"
  Delete "$DESKTOP\Stellarc.lnk"
!macroend
