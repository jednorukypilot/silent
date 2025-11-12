<script lang="ts">
	import { ButtonStyle } from '$lib/enums';

	export let label: string;
	export let href: string = '#';
	export let buttonStyle: ButtonStyle = ButtonStyle.PRIMARY;

	$: buttonClasses = `${
		buttonStyle === ButtonStyle.GREEN
			? 'border-primary bg-primary text-gray-100 hover:bg-[#1b742f]'
			: buttonStyle === ButtonStyle.PRIMARY
				? 'border-secondary bg-secondary text-gray-900 hover:bg-[#cc9b38]'
				: 'border-secondary text-accent bg-transparent hover:bg-[#ffdda0]'
	}`;
</script>

<a {href} class={`border-2 px-6 py-3 font-semibold ${buttonClasses}`}>
	{label}
</a>
