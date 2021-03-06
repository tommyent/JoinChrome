import { AppContext } from "../appcontext.js";

export class Settings extends Array{
    constructor(initial){
        if(Number.isInteger(initial)){
            super(initial);
			return;
        }
        super();
    }
}
const getSettingsdDb = () => {
    const db = new Dexie("join_settings");
    db.version(1).stores({
        settings: 'id,value'
    });
    return db.settings;
}
export class Setting{
    constructor(args = {id,label,subtext,extratext}){
        Object.assign(this,args)
    }
    get value(){
        if(this.isDbSetting){
            return (async ()=>{
                const db = getSettingsdDb();
                const item = await db.get(this.id);
                if(!item) return null;

                return item.value;
            })();
        }
        return AppContext.context.localStorage.get(this.id);
    }
    set value(val){
        if(this.isDbSetting){
            const db = getSettingsdDb();
            db.put({id:this.id,value:val});
            return;
        }
        AppContext.context.localStorage.set(this.id,val);
    }
    get isDbSetting(){
        return false;
    }
}
export class SettingTextInput extends Setting{
    constructor(args = {placeholder,isSecret}){
        super(args)
    }
}
export class SettingEncryptionPassword extends SettingTextInput{
    static get id(){
        return "settingencryptionpassword";
    }
    get value(){
        return Encryption.encryptionPassword;
    }
    set value(val){
        Encryption.encryptionPassword = val
    }
    constructor(){
        super({
            id:SettingEncryptionPassword.id,
            label:"Encrypt Communication",
            placeholder:"Password",
            subtext:"If set, the password will encrypt your pushes before they are sent other devices. The same password must be set on receiving devices.",
            isSecret: true
        })
    }
}
export class SettingEventGhostNodeRedPort extends SettingTextInput{
    static get id(){
        return "SettingEventGhostNodeRedPort";
    }
    get isDbSetting(){
        return true;
    }
    constructor(){
        super({
            id:SettingEventGhostNodeRedPort.id,
            label:"EventGhost, Node-RED",
            placeholder:"Port",
            subtext:`If set, will redirect received Commands to the specified port (<a target="_blank" href="https://joaoapps.com/autoremote/eventghost/">AutoRemote plugin in EventGhost</a> or <a  target="_blank" href="https://joaoapps.com/join/node-red/">Join plugin in Node-RED</a>)`
        })
    }
}
export class SettingAutomationPortFullPush extends SettingTextInput{
    static get id(){
        return "SettingAutomationPortFullPush";
    }
    get isDbSetting(){
        return true;
    }
    constructor(){
        super({
            id:SettingAutomationPortFullPush.id,
            label:"Full Push"
        })
    }
}
export class SettingSingleOption extends Setting{
    //options is {id,label}
    constructor(args = {options}){
        super(args)
    }
}
export class SettingTheme extends SettingSingleOption{
    static get id(){
        return "settingtheme";
    }
    static get themeIdLight(){
        return "light"
    }
    static get themeIdDark(){
        return "dark"
    }
    static get themeIdBlack(){
        return "black"
    }
    get value(){
        return super.value || SettingTheme.themeIdLight;
    }
    set value(val){
        super.value = val
    }
    static get themeOptions(){
        return [
            {
                id:SettingTheme.themeIdLight,
                label:"Light",
                backgroundColor: "white",
                backgroundColorPanel:"#F0F0F0"
            },
            {
                id:SettingTheme.themeIdDark,
                label:"Dark",
                backgroundColor:"#37474F",
                backgroundColorPanel:"#78909C",
                backgroundHover:"#455A64",
                textColor:"white",
                accentColorLowlight:"white"
            },
            {
                id:SettingTheme.themeIdBlack,
                label:"Black",
                backgroundColor:"black",
                backgroundColorPanel:"black",
                backgroundHover:"black",
                textColor:"white",
                accentColorLowlight:"white"
            }
        ]
    }
    static getThemeOption(themeId){
        return SettingTheme.themeOptions.find(option=>option.id == themeId);
    }
    get theme(){
        return SettingTheme.getThemeOption(this.value);
    }
    constructor(){
        super({
            id:SettingTheme.id,
            label:"Theme",
            options:SettingTheme.themeOptions
        })
    }
}
export class SettingColor extends Setting{
    //options is {id,label}
    constructor(args){
        super(args)
    }
}
export class SettingThemeAccentColor extends SettingColor{
    static get id(){
        return "themeaccentcolor";
    }
    get value(){
        return super.value || "#FF9800";
    }
    set value(val){
        super.value = val
    }
    //options is {id,label}
    constructor(args){
        super({
            id:SettingThemeAccentColor.id,
            label:"Accent Color"
        })
    }
}