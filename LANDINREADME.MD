This is explaining the file structure and why it is like the way it is


we have the root file /frontend containing all the files i made for the frontend-this makes it easier to tell backend and frontend apart

in /frontend we have /app which contains the the fallbacks "_layout.tsx" and "index.tsx"-just incase the others fail also contains the .web files with either nothing or little in them0-temp files i dont need (these can be totally overwritten) also contains "index.native.tsx" the welcome page for mobile (all .native is mobile only)-this is just so we can separate tabs and the welcome page
also contains /tabs
/tabs contains
_layout.native.tsx-layout for mobile (layout meaning tab sorting)-IMPORTANT will have to change the tabs part unless eli doesnt that
_layout.tsx-antoher fallback
_layout.web.tsx-layout for web
filters.tsx-filters page not fully made
globe.tsx-globe page not fully made

everything else is basic scaffolding