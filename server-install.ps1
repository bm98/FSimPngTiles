#
# Installs Node JS http server in the current directory
#
# NOTE: require Node.js installed
# 

$pFile='package.json'
if ( !(Test-Path -PathType Leaf -Path $pFile) ) {
  '{}' | Out-File -FilePath $pFile -Encoding ascii
}

npm install 