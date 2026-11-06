param(
    [Parameter(Mandatory = $true)]
    [string]$ExecutablePath
)

$ErrorActionPreference = 'Stop'

# Remove the copied Node executable's Authenticode certificates before postject
# parses it. ImageHlp is built into Windows, so no Windows SDK signtool is needed.
Add-Type -TypeDefinition @'
using System;
using System.ComponentModel;
using System.IO;
using System.Runtime.InteropServices;
using Microsoft.Win32.SafeHandles;

public static class GacJsSeaSignature
{
    [DllImport("imagehlp.dll", SetLastError = true)]
    [return: MarshalAs(UnmanagedType.Bool)]
    private static extern bool ImageEnumerateCertificates(
        SafeFileHandle file, ushort typeFilter, out uint count,
        [Out] uint[] indices, uint indexCount);

    [DllImport("imagehlp.dll", SetLastError = true)]
    [return: MarshalAs(UnmanagedType.Bool)]
    private static extern bool ImageRemoveCertificate(SafeFileHandle file, uint index);

    public static void Remove(string path)
    {
        using (var file = File.Open(path, FileMode.Open, FileAccess.ReadWrite, FileShare.None))
        {
            const ushort CERT_SECTION_TYPE_ANY = 0xff;
            var indices = new uint[1];
            while (true)
            {
                uint count;
                if (!ImageEnumerateCertificates(file.SafeFileHandle, CERT_SECTION_TYPE_ANY, out count, indices, 1))
                    throw new Win32Exception(Marshal.GetLastWin32Error(), "Cannot enumerate SEA executable certificates.");
                if (count == 0) return;
                if (!ImageRemoveCertificate(file.SafeFileHandle, indices[0]))
                    throw new Win32Exception(Marshal.GetLastWin32Error(), "Cannot remove SEA executable certificate.");
                // Enumerate again: certificate indices need not be contiguous or
                // remain stable after removing an entry. Unsigned files are a no-op.
            }
        }
    }
}
'@

[GacJsSeaSignature]::Remove($ExecutablePath)
