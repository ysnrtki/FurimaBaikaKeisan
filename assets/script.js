$(() => {
    const $inputs = $("form input[name]");
    const toNumber = text => ((text || "") + "").replace(/−/g, "-").replace(/[^0-9\.\-]/g, "") * 1;
    const formatAllNumbers = () => {
        $inputs.toArray().forEach(input => {
            let formattedNumber = formatNumber(Math.round(toNumber($(input).val())));
            if ($(input).hasClass("rate")) {
                let number = toNumber($(input).val());
                if (number != 0) {
                    number = Math.round(number * 1000000) / 1000000;
                }
                formattedNumber = formatNumber(number, 6);
                if (formattedNumber.includes(".")) {
                    formattedNumber = formattedNumber.replace(/0+$/, "").replace(/\.$/, "");
                }
                formattedNumber = `${number > 0 ? "+" : ""}${formattedNumber}`;
            }
            formattedNumber = formattedNumber.replace(/^[\+\-]0$/, "0");
            $(input).val(formattedNumber);
            if ($(input).hasClass("form-control-plaintext")) {
                $(input).val(`${$(input).hasClass("price") ? "¥" : ""}${formattedNumber}${$(input).hasClass("rate") ? "%" : ""}`);
            }
        });
    };
    $inputs.filter(":not(.form-control-plaintext)").toArray().forEach(input => $(input).val(localStorage.getItem($(input).attr("name"))));
    $inputs.filter(":not(.form-control-plaintext)").on("blur", function () {
        formatAllNumbers();
        const fees = {
            "メルカリ": 0.1,
            "ラクマ": 0.06 * 1.1,
            "ヤフオク": 0.08 * 1.1,
            "PayPayフリマ": 0.05,
        };
        const basePrice = toNumber($(this).val()) * (1 - fees[$(this).attr("name")]);
        Object.keys(fees).forEach(key => $inputs.filter(`[name='${key}']`).val(basePrice / (1 - fees[key])));
        formatAllNumbers();
        $inputs.filter(":not(.form-control-plaintext)").toArray().forEach(input => localStorage.setItem($(input).attr("name"), $(input).val()));
        $inputs.filter(".form-control-plaintext").toArray().forEach(input => {
            $(input).next(".col-form-label").remove();
            $(input).after($("<div class='col-form-label' />").text($(input).val()));
            $(input).hide();
        });
    }).filter(":first").blur();
    $inputs.filter(":not(.form-control-plaintext)").on("focus", function () {
        $(this).val(toNumber($(this).val()));
        this.select();
    });
});

const isNumber = value => typeof value === "number" && !isNaN(value);
const toInt = (value, defaultValue) => {
    const result = parseInt(value, 10);
    return isNaN(result) ? defaultValue : result;
};

const trimEx = value => {
    if (typeof value === "string") {
        return value.replace(/^[\s　]+|[\s　]+$/g, "");
    }
    return value;
};

const formatNumber = (value, minimumFractionDigits) => {
    if (!isNumber(value)) {
        return value + "";
    }
    if (isNumber(minimumFractionDigits)) {
        minimumFractionDigits2 = minimumFractionDigits;
    } else {
        minimumFractionDigits2 = /\.[0-9]+$/.test(value + "") ? 4 : 0;
    }
    return new Intl.NumberFormat("en", { style: "decimal", minimumFractionDigits: minimumFractionDigits2 }).format(value);
};
