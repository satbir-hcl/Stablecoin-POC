import './ToggleSwitch.css';

interface BaseContainerProps {
    id: string,
    checked: boolean,
    onChange: Function,
    name?: string
    optionLabels?: string[];
    small?: boolean,
    disabled?: boolean
}

function ToggleSwitch({
    id, checked, onChange, name, optionLabels, small, disabled
}: BaseContainerProps) {

    function handleKeyPress(e: { keyCode: number; preventDefault: () => void; }){
        if (e.keyCode !== 32) return;

        e.preventDefault();
        onChange(!checked)
    }

    return (
       <div className={"toggle-switch" + (small ? " small-switch" : "")}>
        <input
            type="checkbox"
            name={name}
            className="toggle-switch-checkbox"
            id={id}
            checked={checked}
            onChange={e => onChange(e.target.checked)}
            disabled={disabled}
        />
            {id ? (
                <label className="toggle-switch-label"
                    htmlFor={id}
                    tabIndex={ disabled ? -1 : 1 }
                    onKeyDown={ (e) => { handleKeyPress(e) }}
                >
                    <span
                        className={disabled ? "toggle-switch-inner toggle-switch-disabled"
                            : "toggle-switch-inner"
                        }
                        data-yes={optionLabels ? optionLabels[0] : "yes"}
                        data-no={optionLabels ? optionLabels[1] : "no"}
                        tabIndex={-1}
                    />
                    <span
                        className={
                            disabled ? "toggle-switch-switch toggle-switch-disabled"
                                : "toggle-switch-switch"
                        }
                        tabIndex={-1}
                    />
                </label>
            ) : null}
        </div>
    );
};

export default ToggleSwitch;
