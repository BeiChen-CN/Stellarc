; Stellarc One-Click Installer
; Branded installation with auto-launch

!macro customHeader
  !define MUI_BRANDINGTEXT "Stellarc - 智能课堂点名助手"
!macroend

!macro customInstall
  ; Write install metadata to registry
  WriteRegStr SHCTX "Software\Stellarc" "InstallPath" "$INSTDIR"
  WriteRegStr SHCTX "Software\Stellarc" "Version" "${VERSION}"
!macroend

!macro customUnInstall
  ; Clean up registry
  DeleteRegKey SHCTX "Software\Stellarc"
!macroend
