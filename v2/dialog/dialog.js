class Dialog{

}

export class DialogSingleChoice extends Dialog{
    constructor({choices}){
        super()
        this.choices = choices;
    }
}

export class DialogInput extends Dialog{
    constructor({title,placeholder}){
        super()
        this.title = title;
        this.placeholder = placeholder;
    }
}
export class DialogProgress extends Dialog{
    constructor({title,text}){
        super()
        this.title = title;
        this.text = text;
    }
}
export class DialogOk extends Dialog{
    constructor({title,text}){
        super()
        this.title = title;
        this.text = text;
    }
}