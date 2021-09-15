cd module
dotnet build --configuration Release
cd ..
mkdir dist\plugins
mkdir dist\css
mkdir dist\icons
mkdir dist\js
xcopy ".\module\RenderWolf\bin\Release\" ".\dist\plugins\" /s /e
cd js
npm run build && cd .. && xcopy ".\js\dist\*" ".\dist\" /s /e